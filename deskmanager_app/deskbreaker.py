import os
from pathlib import Path
import argparse
import csv
import time
import datetime
import random

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "deskmanager.settings")
django.setup()
from users.models import CustomUser
from desks.models import BookSchedule, DeskData, RoomData
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError, transaction

import fade
from pyfiglet import Figlet
from termcolor import colored
import progressbar
from rich_argparse import RichHelpFormatter


COLOR_MAIN = (255, 38, 215)

OUTPUT_POINTER = colored("->", COLOR_MAIN)
OUTPUT_DEBUG = "[" + colored("DEBUG", COLOR_MAIN) + "]"
OUTPUT_WARN = "[" + colored("!", COLOR_MAIN) + "]"
SPLASH_TEXT = ["pentest", "python", "testing"]

widgets = [
    "Progress: ",
    progressbar.Percentage(),
    " ",
    progressbar.Bar(
        marker="~",
        left="[",
        right="]",
    ),
    " ",
    progressbar.ETA(),
]

# ascii art title
print(
    fade.pinkred(
        Figlet(font="moscow", width=90, justify="left").renderText("DeskBreaker")
    )
)

# random splash text
print(
    "//",
    colored(
        f"something something {SPLASH_TEXT[int(time.time()) % len(SPLASH_TEXT)]} tool",
        COLOR_MAIN,
    ),
)
print("")

# command line arguments
parser = argparse.ArgumentParser("", formatter_class=RichHelpFormatter)
parser.add_argument(
    "-d",
    "--dry-run",
    help="perform a dry run without making any changes",
    action="store_true",
    required=False,
)

parser.add_argument(
    "-pu",
    "--pop-users",
    help="create users from provided csv file. format: `username, first_name, last_name, email, password`",
    metavar="<filepath>",
    type=str,
    required=False,
)
parser.add_argument(
    "-du",
    "--delete-users",
    help="delete users from provided csv file. accepts same file as -pd for consistency. format: `username`",
    metavar="<filepath>",
    type=str,
    required=False,
)
parser.add_argument(
    "-su",
    "--stress-users",
    help="stress testing database with selected amount of users.",
    metavar="<amount>",
    type=int,
    required=False,
)
parser.add_argument(
    "-puu",
    "--purge-users",
    help="remove all users from the database (except superusers)",
    action="store_true",
    required=False,
)

parser.add_argument(
    "-fu",
    "--fetch-users",
    help="create csv file with all user info (except passwords duh) in script directory.",
    action="store_true",
    required=False,
)
parser.add_argument(
    "-pd",
    "--pop-desks",
    help=f"create desks from provided csv file. format: `desk_id, room_id, width, height, x, y`",
    metavar="<filepath>",
    type=str,
    required=False,
)
parser.add_argument(
    "-dd",
    "--delete-desks",
    help="delete all desks from provided csv file. accepts same file as -pd for consistency. format: `desk_id`",
    metavar="<filepath>",
    type=str,
    required=False,
)
parser.add_argument(
    "-sd",
    "--stress-desks",
    help="stress testing selected `room_id` with chosen amount of desks",
    metavar=("<amount>", "<room_id>"),
    nargs=2,
    required=False,
)
parser.add_argument(
    "-pud",
    "--purge-desks",
    help="remove ALL desks from the database",
    action="store_true",
    required=False,
)

parser.add_argument(
    "-n",
    "--filename",
    help="optional filename for exported data",
    required=False,
    type=str,
)

RichHelpFormatter.styles = {
    "argparse.args": "bold cyan",  # flags & positional args → primary attention
    "argparse.groups": "bold magenta",  # section headers → clear separation
    "argparse.help": "white",  # help text → maximum readability
    "argparse.metavar": "bright_black",  # metavariables → informative but subtle
    "argparse.prog": "bold green",  # program name → identity anchor
    "argparse.syntax": "yellow",  # inline syntax highlights
    "argparse.text": "white",  # descriptions & epilog
    "argparse.default": "italic dim",  # defaults → de-emphasized
}


args = parser.parse_args()
if not len(os.sys.argv) > 1:
    print(
        f"No argument provided! use {colored('-h', COLOR_MAIN)} to see available options."
    )


class Accounts:
    @staticmethod
    def populate(filename):
        if os.path.isfile(filename):
            print(OUTPUT_POINTER, "Adding users...")
            with open(filename, "r") as f:
                reader = csv.reader(f, delimiter=",")
                rows = list(reader)
                rows.pop(0)

                counter = 0
                for i, user_data in enumerate(rows, start=1):
                    # format: [username, first_name, last_name, email, password]
                    if len(user_data) != 5 or any(
                        not field.strip() for field in user_data
                    ):
                        print(OUTPUT_WARN, f"invalid user {user_data[0]}")
                        continue
                    try:
                        if args.dry_run:
                            print(
                                OUTPUT_POINTER,
                                f"dry run enabled, skipping creation of user {colored(user_data[0], COLOR_MAIN)}",
                            )
                            continue
                        else:
                            CustomUser.objects.create(
                                username=user_data[0],
                                first_name=user_data[1],
                                last_name=user_data[2],
                                email=user_data[3],
                            )
                            CustomUser.objects.filter(username=user_data[0]).update(
                                password=make_password(user_data[4])
                            )
                            counter += 1
                    except IntegrityError:
                        pass
                print(OUTPUT_POINTER, f"Created {colored(counter, COLOR_MAIN)} users.")

    @staticmethod
    def depopulate(filename):
        if os.path.isfile(filename):
            print(OUTPUT_POINTER, "Deleting users...")
            counter = 0
            with open(filename, "r") as f:
                reader = csv.reader(f, delimiter=",")
                for row in reader:
                    # format: [username, first_name, last_name, email, password]
                    user_data = row[0].split(",")
                    if len(user_data) != 1 or any(
                        not field.strip() for field in user_data
                    ):
                        print(OUTPUT_WARN, "invalid user")
                        continue
                    try:
                        if args.dry_run:
                            print(
                                OUTPUT_POINTER,
                                f"dry run enabled, skipping deletion of user {colored(user_data[0], COLOR_MAIN)}",
                            )
                            continue
                        else:
                            with transaction.atomic():
                                try:
                                    user = CustomUser.objects.get(username=user_data[0])
                                    BookSchedule.objects.filter(
                                        desk_user_id=user.id
                                    ).delete()
                                    user.delete()
                                    counter += 1
                                except IntegrityError:
                                    print(
                                        OUTPUT_WARN,
                                        f"error while removing user {colored(user_data[0], COLOR_MAIN)}, skipping...",
                                    )
                                    pass
                    except CustomUser.DoesNotExist:
                        print(
                            OUTPUT_WARN,
                            f"error while removing user {colored(user_data[0], COLOR_MAIN)}, skipping...",
                        )
                        continue
                print(OUTPUT_POINTER, f"Removed {colored(counter, COLOR_MAIN)} users.")

    @staticmethod
    def fetch():
        print(OUTPUT_POINTER, f"Fetching user info...")
        now = datetime.datetime.now().strftime("%d-%m-%Y_%H-%M-%S")
        counter = 0
        file = f"./users_{now}.csv"
        if args.filename:
            file = f"./{args.filename}.csv"
        if os.path.exists(Path(file)):
            print(OUTPUT_WARN, "file already exists.")
            return
        with open(file, "x") as f:
            writer = csv.writer(f, delimiter=",")
            try:
                users = CustomUser.objects.all()  # bold move
            except Exception as e:
                print(OUTPUT_WARN, "error while fetching users:", e)
            # format: [username, first_name, last_name, email]
            writer.writerow(["username", "first_name", "last_name", "email"])
            for user in users:
                user_data = [
                    str(user.username),
                    str(user.first_name),
                    str(user.last_name),
                    str(user.email),
                ]
                if any(not field.strip() for field in user_data):
                    print(
                        OUTPUT_WARN,
                        f"invalid user data for {user.username}, skipping...",
                    )
                    continue
                try:
                    writer.writerow(
                        [
                            str(user.username),
                            str(user.first_name),
                            str(user.last_name),
                            str(user.email),
                        ]
                    )
                    counter += 1
                except Exception as e:
                    print(OUTPUT_WARN, f"error while appending data:", e)
            print(OUTPUT_POINTER, f"Successfully exported {counter} users.")

    @staticmethod
    def stress(num):
        print(
            OUTPUT_POINTER,
            f"Stressing database with {colored(num, COLOR_MAIN)} users...",
        )
        counter = 0
        for i in range(num):
            username = f"stress_user_{1000000 + random.randint(0, 8999999)}"
            try:
                if args.dry_run:
                    print(
                        OUTPUT_POINTER,
                        f"dry run enabled, skipping creation of user {colored(username, COLOR_MAIN)}",
                    )
                else:
                    CustomUser.objects.create(
                        username=username,
                        first_name="Stress",
                        last_name="Test",
                        email=f"{username}@gmail.com",
                    )
                    counter += 1
            except IntegrityError:
                print(
                    OUTPUT_WARN,
                    f"error while adding user {colored(username, COLOR_MAIN)}, skipping...",
                )
                continue
        print(OUTPUT_POINTER, f"Created {colored(counter, COLOR_MAIN)} users.")

    @staticmethod
    def purge():
        test_x = int(random.randint(1, 10))
        test_y = int(random.randint(1, 10))
        try:
            confirm = int(input(f"{OUTPUT_POINTER} u sure? {test_x} + {test_y} ?: "))
        except ValueError:
            print(OUTPUT_POINTER, "Aborting...")
            return
        if confirm == (test_x + test_y):
            if args.dry_run:
                print(OUTPUT_POINTER, "dry run enabled, skipping...")
            else:
                try:
                    print(OUTPUT_POINTER, "purging all users from database...")
                    with transaction.atomic():
                        BookSchedule.objects.all().delete()
                        CustomUser.objects.filter(is_superuser=False).delete()
                    print(
                        OUTPUT_POINTER,
                        f"all users (except superusers) removed from database.",
                    )
                except IntegrityError:
                    print(OUTPUT_WARN, "error while purging users.")
                    return


class Desks:
    @staticmethod
    def populate(filename):
        if os.path.isfile(filename):
            print(OUTPUT_POINTER, "Creating desks.")
            counter = 0
            with open(filename, "r") as f:
                reader = csv.reader(f, delimiter=",")
                next(reader, None)

                counter = 0
                for row in reader:
                    # format: [desk_id, room_id, width, height, x, y]
                    if len(row) != 6 or any(not field.strip() for field in row):
                        print(OUTPUT_WARN, "Invalid desk.")
                        continue
                    try:
                        if args.dry_run:
                            print(
                                OUTPUT_POINTER,
                                f"dry run enabled, skipping creation of desk {colored(row[0], COLOR_MAIN)}",
                            )
                            continue
                        else:
                            room = RoomData.objects.get(room_id=row[1])
                            DeskData.objects.create(
                                desk_id=row[0],
                                room_id=room,
                                width=row[2],
                                height=row[3],
                                x=row[4],
                                y=row[5],
                            )
                            counter += 1
                    except IntegrityError:
                        print(
                            OUTPUT_WARN,
                            f"error while creating desk {colored(row[0], COLOR_MAIN)}, skipping...",
                        )
                        continue
                print(OUTPUT_POINTER, f"Created {colored(counter, COLOR_MAIN)} desks.")

    @staticmethod
    def depopulate(filename):
        if os.path.isfile(filename):
            print(OUTPUT_POINTER, "Removing desks...")
            counter = 0
            with open(filename, "r") as f:
                reader = csv.reader(f, delimiter=",")
                next(reader, None)
                counter = 0
                for row in reader:
                    # format: [desk_id]
                    desk_data = row[0].split(",")
                    if len(desk_data) != 1 or any(not field.strip() for field in row):
                        print(OUTPUT_WARN, "Invalid desk.")
                        continue
                    try:
                        if args.dry_run:
                            print(
                                OUTPUT_POINTER,
                                f"dry run enabled, skipping deletion of desk {colored(row[0], COLOR_MAIN)}",
                            )
                            continue
                        else:
                            desk = DeskData.objects.filter(desk_id=desk_data[0])
                            if not desk:
                                continue
                            desk.delete()
                            counter += 1
                    except IntegrityError:
                        print(
                            OUTPUT_WARN,
                            f"error while removing desk {colored(row[0], COLOR_MAIN)}, skipping...",
                        )
                        continue
                print(OUTPUT_POINTER, f"Removed {colored(counter, COLOR_MAIN)} desks.")

    @staticmethod
    def stress(num, room_id):
        try:
            num = int(num)
            room_id = str(room_id)
        except Exception as e:
            print("really?", e)
            exit()
        print(
            OUTPUT_POINTER,
            f"Stressing database with {colored(num, COLOR_MAIN)} desks...",
        )
        counter = 0
        for i in range(num):
            desk_id = f"desk_{100000 + random.randint(0, 8999999)}"
            room = RoomData.objects.filter(room_id=room_id).first()
            if not room:
                print(
                    OUTPUT_WARN, "room not found. heres a list of rooms if you forgot:"
                )
                rooms = RoomData.objects.all()
                for room in rooms:
                    print(OUTPUT_POINTER, f"{room.floor.floor_id}/{room.room_id}")
                exit()
            try:
                if args.dry_run:
                    print(
                        OUTPUT_POINTER,
                        f"dry run enabled, skipping creation of desk {colored(desk_id, COLOR_MAIN)}",
                    )
                else:
                    DeskData.objects.create(
                        desk_id=desk_id,
                        room_id=room,
                        width=random.randint(50, 200),
                        height=random.randint(50, 200),
                        x=random.randint(0, 1000),
                        y=random.randint(0, 1000),
                    )
                    counter += 1
            except IntegrityError:
                print(
                    OUTPUT_WARN,
                    f"error while adding desk {colored(desk_id, COLOR_MAIN)}, skipping...",
                )
                continue
        print(
            OUTPUT_POINTER,
            f"Created {colored(counter, COLOR_MAIN)} desks in {colored(room_id, COLOR_MAIN)}.",
        )

    @staticmethod
    def purge():
        test_x = int(random.randint(1, 10))
        test_y = int(random.randint(1, 10))
        try:
            confirm = int(input(f"{OUTPUT_POINTER} u sure? {test_x} + {test_y} ?: "))
        except ValueError:
            print(OUTPUT_POINTER, "Aborting...")
            return
        if confirm == (test_x + test_y):
            if args.dry_run:
                print(OUTPUT_POINTER, f"dry run enabled, skipping...")
            else:
                try:
                    print(OUTPUT_POINTER, f"removing all desks from database...")
                    with transaction.atomic():
                        BookSchedule.objects.all().delete()
                        DeskData.objects.all().delete()
                    print(OUTPUT_POINTER, f"all desks removed from database.")
                except IntegrityError:
                    print(OUTPUT_WARN, f"error while purging desks.")
                    return
        else:
            print(OUTPUT_POINTER, "Aborting...")
            return


if args.pop_users:
    Accounts.populate(args.pop_users)
    exit()
elif args.delete_users:
    Accounts.depopulate(args.delete_users)

if args.stress_users:
    Accounts.stress(args.stress_users)

if args.purge_users:
    Accounts.purge()

if args.fetch_users:
    Accounts.fetch()

if args.stress_desks:
    Desks.stress(args.stress_desks[0], args.stress_desks[1])

if args.pop_desks:
    Desks.populate(args.pop_desks)
    exit()
elif args.delete_desks:
    Desks.depopulate(args.delete_desks)

if args.purge_desks:
    Desks.purge()
