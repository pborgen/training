import argparse
import logging
import sys

from dotenv import load_dotenv

from .db import ensure_schema, upsert_document
from .http import PoliteClient
from .scrapers import SCRAPERS


def main() -> None:
    load_dotenv()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("knowledge")

    parser = argparse.ArgumentParser(
        prog="knowledge",
        description="Scrape workout knowledge from the web into Postgres.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init-db", help="Create the knowledge_documents table")
    sub.add_parser("sources", help="List available sources")

    scrape = sub.add_parser("scrape", help="Run a scraper for a given source")
    scrape.add_argument("source", choices=sorted(SCRAPERS.keys()))
    scrape.add_argument("--limit", type=int, default=None, help="Max documents to fetch")
    scrape.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="Minimum seconds between requests to the same host",
    )

    args = parser.parse_args()

    if args.cmd == "init-db":
        ensure_schema()
        log.info("Schema ensured.")
        return

    if args.cmd == "sources":
        for name in sorted(SCRAPERS.keys()):
            print(name)
        return

    if args.cmd == "scrape":
        ensure_schema()
        scraper_cls = SCRAPERS[args.source]
        inserted = 0
        skipped = 0
        with PoliteClient(min_delay=args.delay) as client:
            scraper = scraper_cls(client)
            for doc in scraper.iter_documents(limit=args.limit):
                try:
                    created = upsert_document(doc)
                except Exception as e:
                    log.exception("db write failed for %s: %s", doc.source_url, e)
                    continue
                if created:
                    inserted += 1
                    log.info("inserted %s", doc.source_url)
                else:
                    skipped += 1
                    log.info("skipped (exists) %s", doc.source_url)
        log.info("Done. inserted=%d skipped=%d", inserted, skipped)
        return

    parser.print_help()
    sys.exit(2)


if __name__ == "__main__":
    main()
