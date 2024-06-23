import random
import json

class LevelGenerator:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.board = []
        self.crystals = 0
        self.movable_blocks = 0

    def generate_level(self):
        self.create_initial_layout()
        self.add_features(5)  # Make up to 5 passes adding features
        self.add_player_and_exit()
        return self.board, self.crystals

    def create_initial_layout(self):
        self.board = [["w" for _ in range(self.width)] for _ in range(self.height)]
        for y in range(1, self.height - 1):
            for x in range(1, self.width - 1):
                self.board[y][x] = "."

    def add_features(self, passes):
        for _ in range(passes):
            feature = random.choice([self.add_protected_crystal, self.add_block_depot])
            feature()

    def add_protected_crystal(self):
        # Find a sufficiently large empty area
        x, y = self.find_empty_area(5, 5)
        if x is None or y is None:
            return

        # Create a boxed-in area
        for dy in range(5):
            for dx in range(5):
                if dx == 0 or dx == 4 or dy == 0 or dy == 4:
                    self.board[y + dy][x + dx] = "w"
                else:
                    self.board[y + dy][x + dx] = "."

        # Place the crystal
        crystal_x, crystal_y = x + 2, y + 2
        self.board[crystal_y][crystal_x] = "c"
        self.crystals += 1

        # Add holes and corresponding movable blocks
        directions = [(0, -1), (0, 1), (-1, 0), (1, 0)]
        random.shuffle(directions)
        holes_count = random.randint(1, 3)

        for i in range(holes_count):
            dx, dy = directions[i]
            self.board[crystal_y + dy][crystal_x + dx] = "h"
            self.add_movable_blocks(1)

    def add_block_depot(self):
        x, y = self.find_empty_area(4, 4)
        if x is None or y is None:
            return

        for dy in range(4):
            for dx in range(4):
                if random.random() < 0.7:
                    self.board[y + dy][x + dx] = "m"
                    self.movable_blocks += 1
                elif random.random() < 0.3:
                    self.board[y + dy][x + dx] = "w"

    def add_movable_blocks(self, count):
        for _ in range(count):
            x, y = self.find_empty_space()
            if x is not None and y is not None:
                self.board[y][x] = "m"
                self.movable_blocks += 1

    def add_player_and_exit(self):
        player_x, player_y = self.find_empty_space()
        self.board[player_y][player_x] = "p"

        exit_x, exit_y = self.find_empty_space()
        self.board[exit_y][exit_x] = "x"

    def find_empty_space(self):
        attempts = 100
        while attempts > 0:
            x = random.randint(1, self.width - 2)
            y = random.randint(1, self.height - 2)
            if self.board[y][x] == ".":
                return x, y
            attempts -= 1
        return None, None

    def find_empty_area(self, width, height):
        attempts = 100
        while attempts > 0:
            x = random.randint(1, self.width - width - 1)
            y = random.randint(1, self.height - height - 1)
            if self.is_area_empty(x, y, width, height):
                return x, y
            attempts -= 1
        return None, None

    def is_area_empty(self, x, y, width, height):
        for dy in range(height):
            for dx in range(width):
                if self.board[y + dy][x + dx] != ".":
                    return False
        return True

    def is_valid_position(self, x, y):
        return 0 < x < self.width - 1 and 0 < y < self.height - 1

def generate_level_json(width, height):
    generator = LevelGenerator(width, height)
    board, required_crystals = generator.generate_level()
    
    level_json = {
        "tiles": board,
        "required_crystals": required_crystals
    }
    
    return json.dumps(level_json, indent=2)

# Example usage
level = generate_level_json(22, 16)
print(level)