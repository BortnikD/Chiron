"""Regression checks for local photo fixtures and non-destructive demo upgrades."""

import hashlib
import importlib.util
import json
import re
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("seed-media.py")
SPEC = importlib.util.spec_from_file_location("seed_media", SCRIPT)
MEDIA = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MEDIA)
CATALOG = json.loads((MEDIA.FIXTURES / "photos" / "sources.json").read_text())


class SeedMediaTest(unittest.TestCase):
    def test_catalog_contains_distinct_square_jpegs(self):
        self.assertEqual(27, len(CATALOG))
        contents = []
        for asset in CATALOG:
            content = (MEDIA.FIXTURES / asset["file"]).read_bytes()
            width, height = MEDIA.dimensions(content)
            self.assertEqual(width, height, asset["file"])
            self.assertLessEqual(width, 1024, asset["file"])
            self.assertLess(len(content), 5 * 1024 * 1024)
            if asset["source"] != "User-provided attachment":
                self.assertTrue(asset["source"].startswith("https://"))
                self.assertIn("licenseUrl", asset)
            contents.append(hashlib.sha256(content).hexdigest())
        self.assertEqual(len(CATALOG), len(set(contents)))

    def test_eight_doctors_have_individual_portraits(self):
        portraits = [asset for asset in CATALOG if "veterinarianId" in asset]
        self.assertEqual(8, len(portraits))
        self.assertEqual(8, len({asset["veterinarianId"] for asset in portraits}))
        for asset in portraits:
            resource = {"id": asset["veterinarianId"]}
            self.assertEqual(
                asset["file"], MEDIA.photo_fixture("veterinarians", resource, CATALOG)
            )

    def test_each_seeded_pet_has_an_individual_photo_of_its_species(self):
        seed = SCRIPT.with_name("seed-test-data.sql").read_text(encoding="utf-8")
        pet_rows = seed.split("INSERT INTO pet (", 1)[1].split("AS pets(", 1)[0]
        profiles = re.findall(r"\(\s*(\d+)\s*,\s*\d+\s*,\s*(\d+)\s*,\s*'([^']+)'", pet_rows)
        photos = [asset for asset in CATALOG if "petId" in asset]
        self.assertEqual(19, len(profiles))
        self.assertEqual(len(profiles), len({name for _, _, name in profiles}))
        self.assertEqual(len(profiles), len(photos))
        self.assertEqual(7, sum(photo["source"] == "User-provided attachment" for photo in photos))
        selected = set()
        for number, species, name in profiles:
            resource = {
                "id": f"5eed0107-0000-0000-0000-{int(number):012d}",
                "speciesId": f"5eed0001-0000-0000-0000-{int(species):012d}",
            }
            photo = MEDIA.photo_fixture("pets", resource, CATALOG)
            self.assertIsNotNone(photo, name)
            selected.add(photo)
        self.assertEqual({photo["file"] for photo in photos}, selected)

    def test_old_pet_ids_and_reclassified_pets_do_not_receive_a_fixture(self):
        profile = {
            "id": "5eed0007-0000-0000-0000-000000000001",
            "speciesId": "5eed0001-0000-0000-0000-000000000004",
        }
        self.assertIsNone(MEDIA.photo_fixture("pets", profile, CATALOG))
        profile["id"] = "5eed0107-0000-0000-0000-000000000001"
        profile["speciesId"] = "5eed0001-0000-0000-0000-000000000001"
        self.assertIsNone(MEDIA.photo_fixture("pets", profile, CATALOG))

    def test_custom_entities_are_not_populated(self):
        self.assertIsNone(
            MEDIA.photo_fixture(
                "veterinarians", {"id": "12345678-0000-0000-0000-000000000001"}, CATALOG
            )
        )
        self.assertIsNone(
            MEDIA.photo_fixture(
                "pets", {"id": "12345678-0000-0000-0000-000000000001"}, CATALOG
            )
        )

    def test_old_placeholders_are_replaced_but_custom_photos_are_kept(self):
        original = b"rendered placeholder"
        hashes = [hashlib.sha256(original).hexdigest()]
        with patch.object(MEDIA, "download", return_value=original):
            self.assertTrue(
                MEDIA.should_upload_photo(
                    {"photoUrl": "signed"}, "pets/one", {"pets/one"}, hashes
                )
            )
            self.assertFalse(
                MEDIA.should_upload_photo(
                    {"photoUrl": "signed"}, "pets/two", {"pets/one"}, hashes
                )
            )
        with patch.object(MEDIA, "download", return_value=b"custom user photo"):
            self.assertFalse(
                MEDIA.should_upload_photo(
                    {"photoUrl": "signed"}, "pets/one", {"pets/one"}, hashes
                )
            )

    def test_deleted_photos_stay_deleted_and_unseen_empty_profiles_are_populated(self):
        self.assertFalse(
            MEDIA.should_upload_photo({"photoUrl": None}, "pets/one", {"pets/one"}, [])
        )
        self.assertTrue(
            MEDIA.should_upload_photo({"photoUrl": None}, "pets/two", {"pets/one"}, [])
        )


if __name__ == "__main__":
    unittest.main()
