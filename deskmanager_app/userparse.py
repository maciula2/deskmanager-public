import argparse 
import os 
import csv 

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "deskmanager.settings")
django.setup()

from users.models import CustomUser

from django.db import IntegrityError, transaction

parser = argparse.ArgumentParser('')

parser.add_argument('-f', '--file', type=str, help='Path to the user data file')

args = parser.parse_args()
if not len(os.sys.argv) > 1:
    print('No argument provided. Use -h to see available options.')

# * replace filename with proper data source later
def update_users(filename):
    if os.path.isfile(filename):
        with open(filename, 'r') as f:
            reader = csv.reader(f, delimiter=',')
            rows = list(reader)
            rows.pop(0)
            counter = 0
            for i, user_data in enumerate(rows, start=1):
                if len(user_data) != 5 or any(not field.strip() for field in user_data):
                    print('invalid user, skipping...')
                    continue
                try:
                    with transaction.atomic():
                        try:
                            CustomUser.objects.create(username=user_data[0], first_name=user_data[1], last_name=user_data[2], email=user_data[3])
                            counter+=1
                        except IntegrityError:
                            pass
                except IntegrityError:
                    print(f'error while adding user {user_data[0]}')
                    pass
            print(f'Added {counter} users.')
            return
    else:
        print('source file not found.')
        return

if __name__ == "__main__":
    if args.file:
        update_users(args.file)