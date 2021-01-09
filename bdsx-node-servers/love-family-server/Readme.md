# Love Family Minecraft Server



## Math Game

A math question will popup every 20 seconds, answer it right or else!


---

# Setup

## Enable Cheats

In the console run this to enable admin controls:

- op @a
- changesetting allow-cheats true

Alternatively, edit the world bdt table and set these manually.


----

# Todo

## Math Game

- [x] Record to File
- [ ] Decrease Review Problem Repeat Interval?
- [ ] Select Problem Types

## Math Problem Types

- [x] Addition
    - [ ] Double Digit Addition
- [x] Subtraction
    - [ ] Double Digit Subtraction
- [x] Multiplication
- [x] Division
- [ ] Powers
- [ ] Roots
- [ ] Reduce Fractions
- [ ] Prime Factors
- [ ] Factor Polynomials

## Formula Memorization

- [ ] Geometry Formulas
- [ ] Trigonometry Formulas
- [ ] Derivative Formulas
- [ ] Physics Formulas

## Spelling

- [ ] Add spelling dictionary
- Game modes
    - [ ] Multiple Choice (Choose the correcly spelled word)
    - [ ] Multiple Choice Type (Use buttons to spell the word one letter at a time)
    - [ ] Type the word (show the word for 3 seconds, then type)


# Visualizations

## Using Maps

Give a map item to a player, and when the player equips it, it will automatically fill with the current map location - the player should be near the center to update the entire map.

- /give @s filled_map 1 0 (non-locator map - zoom 0)
- /give @s filled_map 1 2 (locator map - zoom 0)
- /give @s filled_map 1 3 (Ocean Explorer Map)
- /give @s filled_map 1 4 (Woodland Explorer Map)
- /give @s filled_map 1 5 (Treasure Map)

### Report Generator

- Create a building near the center of a map position (far out of normal game play position i.e. 20,000 , 20,000)
- Draw the content with 128x128 blocks in the sky 
- Teleport the player to the map area
- Give a map to the player
- [The player must equip the map to render it]
- Teleport the player back to initial position
- Now the map can be placed in a frame

#### Updatable maps

- Create a filled_map
- Throw the map on the ground (under a structure block)
- Save the map with the structure block
- Now this structure block can clone that map (since it contains the map id)
- To give a map, load the structure with the specific map item
- Now when the player updates this clone, it will also update any duplicates (that might be hanging in item frames)

- A script could be made to update multiple maps, using this technique:
- (Ask player to) clear item from equipped player slot
- Make sure other slots are full (or ask player to select slot 0)
- Draw content
- Give map clone to player (which will be immediately equipped)
- Wait for render (or wait for player input of some type)
- Repeat


## Sorting

https://en.wikipedia.org/wiki/Sorting_algorithm
https://www.youtube.com/watch?v=8MsTNqK3o_w

- [x] Bubble Sort
- [x] Bubble Sort Optimized
- [ ] Insertion Sort
- [ ] Heap Sort
- [ ] Merge Sort: https://www.youtube.com/watch?v=8MsTNqK3o_w&t=953s
- [ ] Tim sort
- [ ] Stable Quick Sort: https://www.youtube.com/watch?v=8MsTNqK3o_w&t=424s
- [ ] Heap Sort: 
- [ ] Block Sort: https://www.youtube.com/watch?v=8MsTNqK3o_w&t=2377s