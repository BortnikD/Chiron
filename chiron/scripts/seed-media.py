"""Populate demo photos and exercise the real authenticated upload API; standard library only."""

import hashlib
import json
import os
import struct
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

BASE = os.environ.get("BACKEND_URL", "http://backend:8080")
STATE = Path(os.environ.get("PHOTO_SEED_STATE", "/state/photos.json"))
FIXTURES = Path(__file__).parent / "fixtures"


def call(method, route, token=None, data=None, file=None, expected=None):
    headers = {}
    body = None
    if token:
        headers["Authorization"] = "Bearer " + token
    if file is not None:
        boundary = "photo-" + uuid.uuid4().hex
        image_type = "png" if file.startswith(b"\x89PNG\r\n\x1a\n") else "jpeg"
        body = (
            (
                f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo.{image_type}"\r\n'
                f"Content-Type: image/{image_type}\r\n\r\n"
            ).encode()
            + file
            + f"\r\n--{boundary}--\r\n".encode()
        )
        headers["Content-Type"] = "multipart/form-data; boundary=" + boundary
    elif data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    try:
        with urlopen(
            Request(BASE + route, body, headers, method=method), timeout=40
        ) as response:
            status = response.status
            raw = response.read()
    except HTTPError as error:
        status, raw = error.code, error.read()
    if expected is not None:
        assert status == expected, (
            f"{method} {route}: expected {expected}, got {status}"
        )
    else:
        assert 200 <= status < 300, f"{method} {route}: got {status}: {raw[:300]!r}"
    if not raw or not 200 <= status < 300:
        return None
    result = json.loads(raw)
    assert result["success"], f"{method} {route}: unsuccessful response"
    return result.get("result")


def login(email, password="password123"):
    return call(
        "POST", "/api/v1/auth/login", data={"email": email, "password": password}
    )["accessToken"]


def download(url, signed=True):
    parts = urlsplit(url)
    # Connect through Docker while preserving the signed public Host header.
    address = os.environ.get("STORAGE_INTERNAL_ADDRESS", "garage:3900")
    target = urlunsplit(
        ("http", address, parts.path, parts.query if signed else "", "")
    )
    with urlopen(
        Request(target, headers={"Host": parts.netloc}), timeout=20
    ) as response:
        return response.read()


def dimensions(jpeg):
    assert jpeg[:2] == b"\xff\xd8", "Expected a JPEG image"
    pos = 2
    while pos < len(jpeg):
        assert jpeg[pos] == 255, "Invalid JPEG marker"
        while jpeg[pos] == 255:
            pos += 1
        marker = jpeg[pos]
        pos += 1
        length = struct.unpack_from(">H", jpeg, pos)[0]
        if marker in (0xC0, 0xC1, 0xC2):
            height, width = struct.unpack_from(">HH", jpeg, pos + 3)
            return width, height
        pos += length
    raise AssertionError("JPEG dimensions not found")


def check_links(photo):
    assert dimensions(download(photo["photoThumbnailUrl"])) == (64, 64)
    assert dimensions(download(photo["photoUrl"])) == (512, 512)
    try:
        download(photo["photoUrl"], signed=False)
    except HTTPError as error:
        assert error.code in (400, 403), (
            f"Unexpected unsigned access status: {error.code}"
        )
    else:
        raise AssertionError("Private image was accessible without a signature")


def photo_fixture(kind, resource, catalog):
    if kind == "veterinarians":
        matches = [
            entry for entry in catalog if entry.get("veterinarianId") == resource["id"]
        ]
    else:
        if not resource["id"].startswith("5eed0007-"):
            return None
        matches = [
            entry
            for entry in catalog
            if entry.get("speciesId") == resource["speciesId"]
        ]
        assert matches, f"No demo photo for species {resource['speciesId']}"
    if not matches:
        return None
    return matches[int(uuid.UUID(resource["id"])) % len(matches)]["file"]


def should_upload_photo(resource, identity, legacy_populated, placeholder_hashes):
    if resource.get("photoUrl") is None:
        return identity not in legacy_populated
    if identity not in legacy_populated:
        return False
    return (
        hashlib.sha256(download(resource["photoUrl"])).hexdigest() in placeholder_hashes
    )


def main():
    STATE.parent.mkdir(parents=True, exist_ok=True)
    state = (
        json.loads(STATE.read_text())
        if STATE.exists()
        else {"populated": [], "verified": False}
    )

    def save():
        temp = STATE.with_suffix(".tmp")
        temp.write_text(json.dumps(state))
        temp.replace(STATE)

    admin = login("admin@demo.chiron.local", "demoAdmin123")
    dataset = call("GET", "/api/v1/users/me", admin)["createdAt"]
    if state.get("dataset") != dataset:
        state = {"dataset": dataset, "populated": [], "verified": False}
    if state.get("catalogVersion") != 2:
        state["legacyPopulated"] = state["populated"]
        state["populated"] = []
        state["catalogVersion"] = 2
        save()
    client = login("client1@seed.chiron.local")
    other_client = login("client2@seed.chiron.local")
    vet = login("vet1@seed.chiron.local")
    first = (FIXTURES / "photo-a.png").read_bytes()
    second = (FIXTURES / "photo-b.png").read_bytes()

    if not state["verified"] or not state.get("placeholderHashes"):
        placeholder_hashes = []
        pets = call("GET", "/api/v1/client/pets", client)
        assert pets, "Demo client must have a pet"
        scratch = call(
            "POST",
            "/api/v1/client/pets",
            client,
            data={
                "name": "Photo integration check",
                "speciesId": pets[0]["speciesId"],
                "gender": "MALE",
            },
        )
        route = f"/api/v1/client/pets/{scratch['id']}/photo"
        try:
            photo = call("PUT", route, client, file=first)
            check_links(photo)
            placeholder_hashes.append(
                hashlib.sha256(download(photo["photoUrl"])).hexdigest()
            )
            call("PUT", route, other_client, file=first, expected=403)
            call("DELETE", route, other_client, expected=403)
            call("PUT", route, file=first, expected=401)
            call("PUT", route, client, file=b"not an image", expected=400)
            call("PUT", route, client, file=b"x" * (5 * 1024 * 1024 + 1), expected=413)
            replacement = call("PUT", route, client, file=second)
            assert (
                replacement["photoUrl"].split("?")[0] != photo["photoUrl"].split("?")[0]
            )
            check_links(replacement)
            placeholder_hashes.append(
                hashlib.sha256(download(replacement["photoUrl"])).hexdigest()
            )
            call("DELETE", route, client, expected=204)
            call("DELETE", route, client, expected=204)
            assert call("GET", route.removesuffix("/photo"), client)["photoUrl"] is None
            final_photo = call("PUT", route, client, file=first)
        finally:
            call("DELETE", route.removesuffix("/photo"), client, expected=204)
        for attempt in range(20):
            try:
                download(final_photo["photoUrl"])
            except HTTPError as error:
                assert error.code == 404
                break
            time.sleep(5)
        else:
            raise AssertionError("Deleted pet photo was not cleaned up")
        if call("GET", "/api/v1/veterinarian/profile", vet)["photoUrl"] is None:
            own_photo = call(
                "PUT", "/api/v1/veterinarian/profile/photo", vet, file=first
            )
            check_links(own_photo)
            call("DELETE", "/api/v1/veterinarian/profile/photo", vet, expected=204)
        state["verified"] = True
        state["placeholderHashes"] = placeholder_hashes
        save()
        print(
            "Photo API checks passed: sizes, signatures, access, validation, replace and delete.",
            flush=True,
        )

    catalog = json.loads((FIXTURES / "photos" / "sources.json").read_text())
    batches = [("veterinarians", call("GET", "/api/v1/admin/veterinarians", admin))]
    page = 0
    while True:
        pets = call("GET", f"/api/v1/admin/pets?page={page}&size=100", admin)
        batches.append(("pets", pets["items"]))
        page += 1
        if page >= pets["totalPages"]:
            break
    populated = set(state["populated"])
    legacy_populated = set(state["legacyPopulated"])
    updated = 0
    for kind, resources in batches:
        for resource in resources:
            fixture = photo_fixture(kind, resource, catalog)
            if fixture is None:
                continue
            identity = f"{kind}/{resource['id']}"
            if identity in populated:
                continue
            # Replace only recognized old placeholders; preserve custom photos and explicit deletions.
            if should_upload_photo(
                resource, identity, legacy_populated, state["placeholderHashes"]
            ):
                photo = call(
                    "PUT",
                    f"/api/v1/admin/{identity}/photo",
                    admin,
                    file=(FIXTURES / fixture).read_bytes(),
                )
                check_links(photo)
                updated += 1
                if updated % 100 == 0:
                    print(f"Uploaded {updated} demo photos...", flush=True)
            populated.add(identity)
            state["populated"].append(identity)
            save()
    print(
        f"Demo photos are ready: {updated} uploaded, {len(populated)} profiles processed; existing changes preserved.",
        flush=True,
    )


if __name__ == "__main__":
    main()
