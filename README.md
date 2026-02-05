
# DeskManager

A Django-based desk reservation and floor/room management application. DeskManager provides models and a UI to manage floors, rooms, desks, and weekly desk booking schedules.

## Table of Contents

- [DeskManager](#deskmanager)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Repository Structure](#repository-structure)
  - [Prerequisites](#prerequisites)
  - [Quick Start (Development)](#quick-start-development)
  - [Configuration](#configuration)
  - [Deployment (Apache/Windows)](#deployment-apachewindows)
    - [1. Update `httpd.conf`](#1-update-httpdconf)
    - [2. Update `httpd-vhosts.conf`](#2-update-httpd-vhostsconf)
    - [3. Finalize Deployment](#3-finalize-deployment)
  - [Running Common Tasks](#running-common-tasks)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- **Space Management:** Manage Floors (`FloorData`), Rooms (`RoomData`), and Desks (`DeskData`).
- **Scheduling:** Weekly booking schedule (`BookSchedule`) with validation.
- **Styling:** Integrated Tailwind CSS.
- **Security:** Basic landing view guarded by authentication.

## Tech Stack

- **Backend:** Python (Django)
- **Database:** MySQL (using `mysqlclient`)
- **Frontend:** JavaScript, HTML, CSS (Tailwind via `django-tailwind`)

## Repository Structure

- `deskmanager_app/` — Main Django project folder
  - `deskmanager/` — Project settings, WSGI/ASGI
  - `core/` — Core app (landing page, app config)
  - `desks/` — Models for office space and scheduling
  - `theme/` — Tailwind/static source files
  - `manage.py` — Django CLI entrypoint
- `requirements.txt` — Python dependencies

## Prerequisites

- **Python 3.12+**
- **MySQL Database**
- **Node.js & npm** (Only required if you need to rebuild Tailwind assets)
- **Virtual Environment tool** (venv, poetry, etc.)

## Quick Start (Development)

1. **Clone the repository**
	 ```batch
	 git clone https://github.com/maciula2/deskmanager.git
	 cd deskmanager
	 ```   
2.  **Set up Virtual Environment**
    
    ```batch
    # Windows
    python -m venv .venv
    .venv\Scripts\activate
    
    # macOS / Linux
    python3 -m venv .venv
    source .venv/bin/activate
    ```
    
3.  **Install Dependencies**
    ```batch
    py -m pip install -r requirements.txt
    ```
    
4.  **Database Setup** Create a MySQL database named `deskmanager` and ensure you have a user with privileges.
    
5.  **Environment Configuration** Create a `.env` file in the `deskmanager_app` folder with the following keys:
    
    
    ```ini, toml
    SECRET_KEY=your_secret_key
    DEBUG=True
    MYSQL_DB_NAME=deskmanager
    MYSQL_USER=your_db_user
    MYSQL_PASSWORD=your_db_password
    EMAIL_HOST_USER=your_email_user
    EMAIL_HOST_PASSWORD=your_email_password
    ```
    
6.  **Initialize Application** 
    ```batch
    py -m deskmanager_app/manage.py makemigrations
    py -m  deskmanager_app/manage.py migrate
    py -m  deskmanager_app/manage.py createsuperuser    
    ```
    
7.  **Tailwind (Optional)** If you need to build the CSS:
    ```batch
    py -m deskmanager_app/manage.py tailwind install
    py -m  deskmanager_app/manage.py tailwind build
    ```
    

## Configuration

-   **Django Settings:** Located in `deskmanager_app/deskmanager/settings.py`.
    
-   **Database:** Configure via the `.env` file referenced above.
    
-   **Static Files:** Tailwind source is located at `deskmanager_app/theme/static_src/`.
    

## Deployment (Apache/Windows)

To deploy on Windows using Apache and `mod_wsgi`, configure your `httpd.conf` and `httpd-vhosts.conf` files as shown below.

### 1. Update `httpd.conf`

Add the following to load the Python DLL and the WSGI module.
```ApacheConf
# Load Python DLL
LoadFile "/path/to/python(version).dll"

# Load mod_wsgi module
# Ensure the path points to the mod_wsgi.pyd inside your virtual environment
LoadModule wsgi_module "/path/to/wsgi/module"

```

### 2. Update `httpd-vhosts.conf`

Configure the virtual host to serve static files and the WSGI application.
```ApacheConf
<VirtualHost *:80>
    # 1. Static Files Configuration
    Alias /theme/static/ "(global_path)/deskmanager/deskmanager/deskmanager_app/staticfiles/"
    
    <Directory "(global_path)/deskmanager/deskmanager/deskmanager_app/staticfiles">
        Require all granted
    </Directory>

    # 2. WSGI Directory Configuration
    <Directory "(global_path)/deskmanager/deskmanager/deskmanager_app/deskmanager">
        <Files wsgi.py>
            Require all granted
        </Files>
    </Directory>

    # 3. Script Alias
    WSGIScriptAlias / "(global_path)/deskmanager/deskmanager/deskmanager_app/deskmanager/wsgi.py"

    # 4. Logs
    ErrorLog "logs/deskmanager-error.log"
    CustomLog "logs/deskmanager-access.log" common
</VirtualHost>
```
### 3. Finalize Deployment

Before restarting Apache, collect static files to the folder specified in the configuration:
```batch
py -m  deskmanager_app/manage.py collectstatic

```

## Running Common Tasks

-   **Run Tests:**
    ```batch
    py -m  deskmanager_app/manage.py test
    ```
    
-   **Update Models:**    
    ```batch
    py -m deskmanager_app/manage.py makemigrations
    py -m deskmanager_app/manage.py migrate
    ```
    

## Contributing

1.  Fork the repository.
    
2.  Run linters/tests before submitting.
    
3.  Ensure migrations are included for model changes.
    
4.  Open a Pull Request.
    

## License

_No license is currently defined. Please add a LICENSE file (e.g., MIT, Apache-2.0)._
DeskManager is licensed under the [Apache-2.0](https://github.com/maciula2/deskmanager-public/blob/main/LICENSE) license
