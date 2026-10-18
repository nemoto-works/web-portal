"""History Neighbors MVP structural and data smoke tests."""
import pathlib
import re
import unittest

HTML = (pathlib.Path(__file__).resolve().parent / "index.html").read_text(encoding="utf-8")

class HistoryNeighborsTests(unittest.TestCase):
    def test_basic_markup(self):
        for token in ('id="timeline"', 'id="track"', 'id="answers"', 'id="feedback"', 'id="next"', 'id="review"'):
            self.assertIn(token, HTML)

    def test_timeline_uses_year_distance(self):
        self.assertIn('(year-start)/(end-start)', HTML)
        self.assertIn('scrollLeft', HTML)

    def test_progress_and_review(self):
        for token in ("localStorage.setItem(key", "localStorage.getItem(key)", "reviewIndex", "frontier++", "if(!confirm("):
            self.assertIn(token, HTML)

    def test_history_data_sorted_unique(self):
        pairs = re.findall(r"\{year:(\d+),name:'([^']+)'\}", HTML)
        self.assertGreaterEqual(len(pairs), 20)
        years = [int(y) for y, _ in pairs]
        self.assertEqual(years, sorted(years))
        self.assertEqual(len(years), len(set(years)))
        self.assertEqual(len([n for _, n in pairs]), len(set(n for _, n in pairs)))

    def test_escapes_dynamic_names_with_textcontent(self):
        self.assertIn('name.textContent=', HTML)
        self.assertIn('b.textContent=v.name', HTML)

if __name__ == "__main__":
    unittest.main()
