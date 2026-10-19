"""History Neighbors LAB structural, safety, and dataset smoke tests."""
import pathlib
import re
import unittest

HTML = (pathlib.Path(__file__).resolve().parent / "index.html").read_text(encoding="utf-8")

class HistoryNeighborsTests(unittest.TestCase):
    def test_mobile_and_accessible_markup(self):
        for token in ('name="viewport"', 'lang="ja"', 'aria-live="polite"', 'tabindex="0"'):
            self.assertIn(token, HTML)

    def test_two_modes_and_core_controls(self):
        for token in ('id="mode-japan"', 'id="mode-world"', 'id="timeline"', 'id="answers"', 'id="next"', 'id="review"', 'id="reset"'):
            self.assertIn(token, HTML)

    def test_timeline_uses_year_distance_and_scroll(self):
        self.assertIn("(year-(min-padding))/(max-min+padding*2)", HTML)
        self.assertIn("scrollLeft", HTML)

    def test_progress_is_separate_per_mode(self):
        self.assertIn("'history-neighbors-lab-'+state.mode", HTML)
        self.assertIn("localStorage.setItem(storageKey()", HTML)

    def test_datasets_are_sorted_unique_and_have_explanations(self):
        match = re.search(r"japan:\[(.*?)\],world:\[(.*?)\]\};", HTML, re.S)
        self.assertIsNotNone(match)
        blocks = match.groups()
        for block in blocks:
            entries = re.findall(r"\{year:(-?\d+),name:'([^']+)',detail:'([^']+)',source:'([^']+)'", block)
            self.assertGreaterEqual(len(entries), 20)
            years = [int(entry[0]) for entry in entries]
            names = [entry[1] for entry in entries]
            self.assertEqual(years, sorted(years))
            self.assertEqual(len(years), len(set(years)))
            self.assertEqual(len(names), len(set(names)))
            self.assertTrue(all(entry[2] and entry[3] for entry in entries))

    def test_sources_and_safe_dynamic_text(self):
        for host in ('archives.go.jp', 'worldhistory.org', 'metmuseum.org'):
            self.assertIn(host, HTML)
        self.assertIn("card.textContent=", HTML)
        self.assertIn("button.textContent=event.name", HTML)
        self.assertNotIn("fetch(", HTML)

if __name__ == "__main__":
    unittest.main()
