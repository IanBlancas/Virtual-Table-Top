# FlatTop Virtual Tabletop User Manual

## What you need to download

- Python 3.11 or newer
- Git client (optional) or the project ZIP archive
- A command prompt / terminal on Windows

## Required Python packages

Install these packages before running the app:

- Django 5.2.7
- channels
- Pillow

## Setup commands

From the project root:

1. Create a virtual environment:
 
python -m venv venv

2. Activate the environment:
 
.\venv\Scripts\activate

3. Install dependencies
 
pip install django==5.2.7 channels pillow

4. Apply database migrations:
 
python manage.py migrate

5. Start the development server:
 
python manage.py runserver
 

6. Open the app in your browser:

http://127.0.0.1:8000

## Logging in

- Use the login page to sign in or register a new account.
- After login, you will be redirected to the lobby.

## Main user interface

FlatTop uses a widget-driven board. The main widget types include:

- Card widget
- Custom card widget
- Image widget
- Token widget
- Counter widget
- Note widget
- Dice roller widget
- Drawing widget
- Soundboard widget

## Basic board actions

- Click a widget to select it.
- Drag selected widgets to move them around.
- Use lasso selection to select multiple widgets.
- Hold middle click and drag on empty board space to pan.
- Use the left toolbar buttons to add new widgets.
- Use the keyboard shortcut `Ctrl + S` to manually save.
- Use `Ctrl + O` to load a JSON board state.

## Board menus and chat

The top header includes these board menus:

- File: Save board JSON, load a board, and select an autosave file.
- Lobby: Manage the current session, players, and lobby settings.
- Insert: Add images, shapes, trays, and labels to the board.
- View: Toggle the grid, reset the view, zoom to fit, show all widgets, and enter fullscreen.
- Help: Open shortcuts, documentation, and about/support information.

Press C or click chat bar to open the global chat panel. Type a message and press Send to talk to other players. Close or minimize the chat panel with its close button or the Esc key.

## Private Board

The private board is a per-user hidden workspace separate from the shared public board. Anything placed on the private board is only visible to you, not to other players.

Use the private board for:

- secret notes
- private hand cards
- hidden tokens
- personal planning and private game setup

The private board supports its own private notes and tokens and helps keep sensitive information out of the shared game view.

## Widget-specific controls

### Cards

- Flip cards individually or in groups using the `F` key.
- Shuffle and reset decks from the card controls.
- Move cards between Private and Public board with the `P` Key

### Custom cards

- Upload PNG or JPEG images to create custom cards.
- Uploaded images are stored on the server and can be reused later.

### Images and tokens

- Drag image files onto the board or into tokens to change their appearance.
- Tokens can switch between circle and square shapes.

### Counters

- Edit counter names and values directly.
- Use arrow keys to increase or decrease values.
- Hold `Shift` while using arrows to change by 5.

### Notes

- Add text notes with full typing support.
- Resize notes by dragging their corners.
- Notes save as part of the board state.

### Dice roller

- Enter dice text like `2d6 + 3`.
- The widget calculates the result automatically.

### Drawing widget

- Draw on the board using the color picker and brush controls.
- Use erase, laser, size, and clear controls.
- Close the drawing widget with the `x` button.

### Soundboard

- Play, loop, and stop sounds from the soundboard widget.
- Each sound has its own volume slider.
- Use the stop-all button to silence all sounds.

## Saving and loading

- The app autosaves changes periodically.
- Manual save is available via `Ctrl + S` or the save button.
- Use the load menu or `Ctrl + O` to open a saved JSON board file.
- Board state includes widget positions, images, text, and other settings.

## Troubleshooting

- If the app does not start, confirm the virtual environment is active.
- If Django is missing, reinstall with `pip install django==5.2.7`.
- If uploaded images fail, check that `media/` exists and is writable.
- If a widget does not load, refresh the page and retry.

## Notes

- This project uses SQLite by default (`db.sqlite3`).
- Uploaded board assets are saved under `media/`.
- The app is configured for local development and should not be run in production without proper security settings.
