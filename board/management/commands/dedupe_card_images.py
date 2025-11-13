from django.core.management.base import BaseCommand
from django.conf import settings
from board.models import CardImage
import os
import hashlib


def compute_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


class Command(BaseCommand):
    help = 'Find and optionally delete duplicate files under MEDIA_ROOT/card_images/ and rewire CardImage rows to the kept file.'

    def add_arguments(self, parser):
        parser.add_argument('--confirm', action='store_true', help='Actually delete duplicate files and update DB rows. Without this flag the command performs a dry run.')
        parser.add_argument('--keep', choices=['oldest', 'newest', 'lex'], default='oldest', help='Which file to keep among duplicates (default: oldest by mtime).')

    def handle(self, *args, **options):
        media_dir = os.path.join(settings.MEDIA_ROOT, 'card_images')
        if not os.path.isdir(media_dir):
            self.stdout.write(self.style.ERROR(f'Media directory not found: {media_dir}'))
            return

        # Gather files
        files = []
        for entry in os.scandir(media_dir):
            if entry.is_file():
                files.append(entry.path)

        self.stdout.write(f'Scanning {len(files)} files in {media_dir}...')

        # Compute hashes
        hash_map = {}
        for p in files:
            try:
                h = compute_hash(p)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not hash {p}: {e}'))
                continue
            hash_map.setdefault(h, []).append(p)

        # Find duplicates
        dup_groups = {h: ps for h, ps in hash_map.items() if len(ps) > 1}
        if not dup_groups:
            self.stdout.write(self.style.SUCCESS('No duplicate files found.'))
            return

        self.stdout.write(f'Found {len(dup_groups)} duplicate groups.')

        total_dups = 0
        total_deleted = 0
        total_relinked = 0

        for h, paths in dup_groups.items():
            # choose keeper
            if options['keep'] == 'lex':
                keeper = sorted(paths)[0]
            elif options['keep'] == 'newest':
                keeper = max(paths, key=lambda p: os.path.getmtime(p))
            else:
                # oldest
                keeper = min(paths, key=lambda p: os.path.getmtime(p))

            to_remove = [p for p in paths if p != keeper]
            total_dups += len(to_remove)

            keeper_rel = os.path.relpath(keeper, settings.MEDIA_ROOT).replace('\\', '/')
            self.stdout.write(f'Group hash={h}: keep {keeper_rel}, remove {len(to_remove)} files')

            for dup in to_remove:
                dup_rel = os.path.relpath(dup, settings.MEDIA_ROOT).replace('\\', '/')
                # Update DB rows that reference the duplicate path to point to keeper_rel
                updated = 0
                try:
                    q = CardImage.objects.filter(image=dup_rel)
                    updated = q.update(image=keeper_rel)
                except Exception:
                    # best-effort: try endswith match
                    try:
                        q = CardImage.objects.filter(image__endswith=os.path.basename(dup_rel))
                        updated = q.update(image=keeper_rel)
                    except Exception:
                        updated = 0

                total_relinked += updated

                if options['confirm']:
                    try:
                        os.remove(dup)
                        total_deleted += 1
                        self.stdout.write(self.style.SUCCESS(f'Deleted {dup_rel} (relinked {updated} DB rows)'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Failed to delete {dup_rel}: {e}'))
                else:
                    self.stdout.write(self.style.WARNING(f'[DRY RUN] Would remove {dup_rel} (relink {updated} DB rows to {keeper_rel})'))

        self.stdout.write('')
        self.stdout.write(f'Total duplicate files identified: {total_dups}')
        self.stdout.write(f'Total DB rows relinked: {total_relinked}')
        if options['confirm']:
            self.stdout.write(self.style.SUCCESS(f'Total files deleted: {total_deleted}'))
        else:
            self.stdout.write(self.style.WARNING('No files deleted (dry run). Re-run with --confirm to perform deletions.'))
