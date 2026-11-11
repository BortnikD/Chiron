"""Regression checks for local photo fixtures and non-destructive demo upgrades."""

import hashlib
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("seed-media.py")
SPEC = importlib.util.spec_from_file_location("seed_media", SCRIPT)
MEDIA = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MEDIA)
CATALOG = json.loads((MEDIA.FIXTURES / "photos" / "sources.json").read_text())


class SeedMediaTest(unittest.TestCase):
    def test_catalog_contains_twenty_distinct_square_jpegs(self):
        self.assertEqual(20, len(CATALOG))
        contents = []
        for asset in CATALOG:
            content = (MEDIA.FIXTURES / asset["file"]).read_bytes()
            self.assertEqual((1024, 1024), MEDIA.dimensions(content), asset["file"])
            self.assertLess(len(content), 5 * 1024 * 1024)
            self.assertTrue(asset["source"].startswith("https://"))
            self.assertIn("licenseUrl", asset)
            contents.append(hashlib.sha256(content).hexdigest())
        self.assertEqual(20, len(set(contents)))

    def test_eight_doctors_have_individual_portraits(self):
        portraits = [asset for asset in CATALOG if "veterinarianId" in asset]
        self.assertEqual(8, len(portraits))
        self.assertEqual(8, len({asset["veterinarianId"] for asset in portraits}))
        for asset in portraits:
            resource = {"id": asset["veterinarianId"]}
            self.assertEqual(
                asset["file"], MEDIA.photo_fixture("veterinarians", resource, CATALOG)
            )

    def test_all_seeded_pet_species_receive_only_matching_photos(self):
        counts = [4, 4, 1, 1, 1, 1]
        for number, expected_count in enumerate(counts, 1):
            species_id = f"5eed0001-0000-0000-0000-{number:012d}"
            allowed = {
                asset["file"]
                for asset in CATALOG
                if asset.get("speciesId") == species_id
            }
            self.assertEqual(expected_count, len(allowed))
            selected = set()
            for pet_number in range(1, 21):
                resource = {
                    "id": f"5eed0007-0000-0000-0000-{pet_number:012d}",
                    "speciesId": species_id,
                }
                first = MEDIA.photo_fixture("pets", resource, CATALOG)
                self.assertIn(first, allowed)
                self.assertEqual(first, MEDIA.photo_fixture("pets", resource, CATALOG))
                selected.add(first)
            self.assertEqual(allowed, selected)

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
