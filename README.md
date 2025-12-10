# FlatTop Virtual Tabletop (VTT)

Technical & User Documentation Manual

1. Introduction

FlatTop is a web-based 2D Virtual Tabletop (VTT) designed for board games, card games, tabletop RPGs, and collaborative interactive experiences. It provides a widget-driven interface that lets players and game masters place tokens, cards, notes, dice, and other interactive elements onto a shared or private board. Save-states, autosaving, snapping, multi-selection, and touch controls provide a robust and adaptable environment for tabletop-style gameplay.

This manual outlines features, architecture, usage instructions, and developer guidelines.

To get started and run the program, simply download the files from this github into a single directory, open that directory in a command line window, then use the command "python manage.py runserver". You may, of course, need to install some dependencies first, like python itself, Django, and the Pillow library we used for the custom card widgets.

2. System Overview

FlatTop consists of:

Django Backend: Handles API endpoints, session management, board persistence, user accounts, and asset delivery.

Frontend (HTML/CSS/JS): Renders the board, widgets, drag-and-drop movement, snapping, selection boxes, and UI components.

Database (MySQL): Stores user boards, metadata, save-states, and asset links.

JSON-Based Save System: Represents all widgets and board states in a portable format for export/import.

3. Widgets

Widgets are draggable board elements. Each widget stores its own properties and updates live in the interface.

3.1 Widget Types

Card Widget

-Draw cards

-Flip cards individually or as a group using F key

-Shuffle or reset the deck

-Multi-select for bulk flip/delete

Custom Card Widget

-Each card may be text or image

-Supports PNG and JPEG files uploads

-Uploaded images are stored on the server so the deck can be reused across sessions.

-Includes Draw, Shuffle, Reset, and Flip, identical to the standard card widget.

Image Widget

-Can be dragged onto the board either from a local file on a user's computer or from another browser tab

-Supports rotation for the image in 90 degree increments

Token Widget

-Used for character pieces, markers, or game components

-An image can be dragged onto a token through the same methods as in the image widget below to change the token's background

-Changes to a circle or square byu using the button next to the x while the token is selected

Counter Widget

-Multiple counters, each with their own editable name and value, can be added to one widget

-The value of each counter can be changed either through manual data entry, or through clicking on the value and using the up or down arrow keys to add or subtract, respectively

-Using shift and arrow keys changes the value in increments of 5 instead of 1

Note Widget

-When pressing the “note” widget button the widget will appear on the board.

-Once the widget has appeared, you will be prompted to begin typing, standard text document functionality is possible within the widget such as ctrl + c and ctrl + v.

-The widget can be adjusted by clicking on the corner and dragging it to the desired dimensions. The widget will adjust automatically to the proper proportions. It may also create scroll bars if needed to navigate the content of the widget. 

-The info within the note will be saved in the JSON file when the board is saved. It will load whatever was in the notes widget when loaded later.

-The widget can be closed by pressing the “x” button.

Dice Roller Widget

-A widget that simulates rolling dice, when you input text of the format (+integer) d (+integer), with the first integer being the amount of dice and the second being the number of sides on each die ex. 2d6 + 3

-Additionally, you can also add or subtract a further integer from the final total of a "roll" if need be

Drawing Widget

-The “Draw” widget will spawn once the user selects the button.

-A canvas will spawn above everything on the board, which is what the user uses to draw on.

-The draw widget will have a color picker, erase, laser, size, and clear buttons that are used for its unique functionality 

-The color picker supports full RGB color selection, allowing the user to also pick colors of lower and higher opacity and saturation.

-All the user has to do is place the slider on a location on the color bar and select a color 

-Direct RGB values can be used with the prompted R G B boxes below the color slider

-A dropper button is available next to the color slider that allows you to hover over the board and zoom into pixel view to select an existing color. 

-The size slider changes the size of the brush accordingly from left to right (smaller to larger)

-When selected the eraser button will highlight red, and you can begin to delete strokes made by the user. The eraser can only delete complete strokes, with no partial erasing possible.

-The laser button, when selected, lights up in a blue color and functions the same as the drawing, but deletes itself after a few seconds.

-The clear button will fully delete everything from the canvas. 

-You close the widget using the x icon in the corner. 

Soundboard

-When the “Sound Board” widget is selected, it will appear on the board with 4 default sounds, each having its own volume slider, loop, and play button, as well as a stop all button

-Any sound will play for its duration when the play button is selected. 

-When a loop is selected, and the sound is played again, the selected sound will loop until stopped by the stop all button or if the user clicks the loop button again. 

-Multiple sounds can be played at once and looped all together.

-The stop all button will silence all sounds 

-The x icon in the corner will also function the same as the stop all button, but will also delete the widget.

4 Board Layout

4.1 Public Board

The shared play surface where all players can interact.

4.2 Private Board

A player-specific hidden area intended for:

-Hand cards

-Secret notes

-Hidden tokens

5. Interaction Features

5.1 Drag and Drop

All widgets can be moved freely on the board

5.2 Lasso Selection

Click and drag to form a rectangle

All widgets within the area are selected

Selected widgets highlight

Move or delete multiple items at once

5.3 Snap-to-Grid

Grid overlay

Widgets align to nearest grid coordinates at top left corner of widget

6. Touch Controls

FlatTop includes touch functionality:

-One-finger drag moves the board

-Two-finger pinch to zoom in or out

-Some interaction with widgets

7. Saving & Loading

7.1 Autosave

Occurs every 5 seconds if a change to the board or widgets has occured

7.2 Manual Save

User-triggered save option, either via CTRL + S or the save button along the top toolbar

7.3 JSON Save-State Format

Example structure:

{
  "widgets": [
    {
      "type": "card",
      "x": 120,
      "y": 340,
      "rotation": 90,
      "image": "goblin.png",
      "name": "Goblin Scout"
    }
  ],
  "board_settings": {
    "snap": true,
    "grid": true,
    "scale": 1.0
  }
}

7.4 Loading

Reconstructs widget objects from saved JSON, can be triggered either by hitting CTRL + O and selecting the .JSON file you would like to open, or by using the drop-down menu under File in the top toolbar

Restores positions, images, rotations, and some metadata

8. Architecture

8.1 Backend (Django)

REST endpoints for save/load

Handles authentication and session logic

Stores JSON states

8.2 Frontend JS

Tracks active widgets

Renders board and UI

Manages drag, rotation, selection

Runs autosave timer

8.3 Future Multiplayer Sync

Planned:

WebSocket channels for real-time updates

Multi-user cursors

Conflict resolution (GM and Player roles)

9. Developer Guide

9.1 Adding a New Widget Type

Create a frontend class with render, update, and serialize methods

Add corresponding JSON parsing logic in load function

Add backend schema updates (if needed)

9.2 Editing Save-State Structure

Modify frontend serialization and backend storage fields

9.3 Touch Input Extensions

Add new gestures to event listeners

10. User Guide

10.1 Creating Widgets

Use toolbar buttons to spawn tokens, cards, dice, counters, etc.

10.2 Moving Objects

Mouse: click and drag

Touch: press and drag

10.3 Using Lasso Select

Hold mouse and drag box

Selected widgets highlight

10.4 Saving

Automatic or manual via save button

10.5 Loading Boards

Load previous sessions from menu

11. Troubleshooting

If widgets fail to load: check JSON for missing fields

If grid snapping misaligns: ensure correct grid size

If touch gestures conflict: test on device and adjust event priority

12. Roadmap

Multiplayer sync

Improved note widget saving

Custom scripting engine

Game module templates

Room/lobby system

13. Glossary

Widget: Any movable board object

JSON: JavaScript Object Notation, used for save states

VTT: Virtual Tabletop

14. Version

This manual corresponds to FlatTop version: Fall 2025 Build
