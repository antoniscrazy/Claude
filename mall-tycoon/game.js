// Game Configuration
const CONFIG = {
    GRID_SIZE: 32,
    TILE_SIZE: 32,
    INITIAL_MONEY: 10000,
    CUSTOMER_SPAWN_RATE: 0.02,
    DAY_DURATION: 60000, // 60 seconds per day
    SHOP_TYPES: {
        'shop-food': { name: 'Food Shop', cost: 500, income: 50, color: '#ff6b6b', category: 'food', popularity: 0.8, efficiency: 0.7, maxCustomers: 8 },
        'shop-clothing': { name: 'Clothing Shop', cost: 800, income: 80, color: '#4ecdc4', category: 'clothing', popularity: 0.9, efficiency: 0.8, maxCustomers: 3 },
        'shop-electronics': { name: 'Electronics', cost: 1200, income: 120, color: '#ffe66d', category: 'electronics', popularity: 0.7, efficiency: 0.6, maxCustomers: 3 },
        'shop-entertainment': { name: 'Entertainment', cost: 1000, income: 100, color: '#a8e6cf', category: 'entertainment', popularity: 0.95, efficiency: 0.75, maxCustomers: 6 },
        'shop-jewelry': { name: 'Jewelry Store', cost: 1500, income: 150, color: '#ff9ff3', category: 'luxury', popularity: 0.6, efficiency: 0.5, maxCustomers: 3 },
        'shop-books': { name: 'Bookstore', cost: 600, income: 60, color: '#a8dadc', category: 'books', popularity: 0.75, efficiency: 0.85, maxCustomers: 7 },
        'shop-sports': { name: 'Sports Store', cost: 900, income: 90, color: '#06ffa5', category: 'sports', popularity: 0.85, efficiency: 0.8, maxCustomers: 3 },
        'shop-beauty': { name: 'Beauty Salon', cost: 1100, income: 110, color: '#ffb3ba', category: 'beauty', popularity: 0.9, efficiency: 0.7, maxCustomers: 3 }
    },
    CONVERSATION_PHRASES: {
        shopping: [
            "This place is great!",
            "I love shopping here!",
            "The prices are good",
            "Nice selection!",
            "I'll come back!",
            "This is my favorite store",
            "Great service!",
            "Amazing deals!",
            "So many options!",
            "Perfect for gifts!"
        ],
        food: [
            "This food is delicious!",
            "Yummy!",
            "Great meal!",
            "I love this place!",
            "Best food in the mall!",
            "So tasty!",
            "I'll come back for more!",
            "Amazing food!"
        ],
        trashbin: [
            "Need to throw this away",
            "Where's the trash?",
            "This bin is full!",
            "I'll find another bin",
            "Gotta dispose of this"
        ],
        bench: [
            "Time for a break",
            "This is nice",
            "I needed to sit down",
            "Comfortable bench",
            "Taking a rest"
        ],
        leaving: [
            "Had a great time!",
            "I'll be back!",
            "Nice mall!",
            "See you next time!"
        ]
    },
    CUSTOMERS_PER_FLOOR_TILE: 2, // Max customers per floor tile
    BASE_MAX_CUSTOMERS: 10, // Base max customers
    CUSTOMER_SERVICE_CAPACITY: 5, // Customers added per Customer Service
    CUSTOMER_SERVICE_MAX: 8, // Maximum Customer Services allowed
    CUSTOMER_SERVICE_COST: 400, // Cost to build Customer Service
    CUSTOMER_SERVICE_UNLOCK_DAY: 2, // Day when Customer Service unlocks
    CUSTOMER_COLORS: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff9ff3', '#a8dadc', '#06ffa5', '#ffb3ba', '#c7ceea', '#ffd93d'],
    DECORATION_TYPES: {
        'decoration-bench': { name: 'Bench', cost: 100, reviewBoost: 0.1, color: '#8b4513' },
        'decoration-plant': { name: 'Plant', cost: 50, reviewBoost: 0.05, color: '#228b22' },
        'decoration-fountain': { name: 'Fountain', cost: 300, reviewBoost: 0.2, color: '#4a9eff' },
        'decoration-art': { name: 'Art Display', cost: 200, reviewBoost: 0.15, color: '#ffd700' },
        'decoration-trashbin': { name: 'Trash Bin', cost: 75, reviewBoost: 0.08, color: '#555555', spillReduction: 0.3 }
    },
    JANITOR_COST: 500,
    JANITOR_SALARY: 50, // Per day
    SPILL_SPAWN_RATE: 0.001,
    SPILL_CLEAN_CLICKS: 3,
    JANITOR_CLEAN_TIME: 5000, // 5 seconds
    EVENT_INTERVAL: 900000, // 15 minutes
    RUSH_HOUR_MULTIPLIER: 2.0,
    MAX_SHOP_CAPACITY: 10, // Maximum customers per shop
    TRASH_BIN_VISIT_CHANCE: 0.95, // 95% chance customers visit trash bins
    TRASH_BIN_CAPACITY: 10, // Maximum trash in bin
    ENTRANCE_BASE_COST: 200, // Base cost for entrances after first
    ENTRANCE_COST_INCREMENT: 50, // Additional cost per existing entrance
    CUSTOMER_COLLISION_RADIUS: 0.3, // Collision avoidance radius
    CUSTOMER_AVOIDANCE_FORCE: 0.5, // Force to avoid collisions
    STAIRS_COST: 300, // Cost to build stairs
    STAIRS_UNLOCK_DAY: 5, // Day when stairs unlock
    ELEVATOR_COST: 500, // Cost to build elevator
    ELEVATOR_REVIEW_BOOST: 0.15, // Review boost per elevator
    EMPLOYEE_LEAVE_CHANCE: 0.001, // Chance per frame for employees to leave when unpaid
    DISABLED_SPAWN_CHANCE: 0.03, // 3% chance customer spawns disabled
    STAIRS_INJURY_CHANCE: 0.003, // 0.3% chance to break legs when using stairs
    DISABLED_SPEED_MULTIPLIER: 0.6, // Disabled customers move 60% speed
    HOSPITAL_STAFF_SPEED: 0.8, // Hospital staff movement speed
    CUSTOMER_NAMES: ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Kai', 'Logan', 'Noah'],
    LOYALTY_CARD_BONUS: 1.2, // 20% income bonus for loyalty card holders
    LOYALTY_CARD_SPAWN_CHANCE: 0.01, // 1% chance customer spawns with loyalty card
    FAMILY_SPAWN_CHANCE: 0.02, // 2% chance to spawn as family (2 customers together)
    WANDER_AFTER_SHOPPING_CHANCE: 0.3, // 30% chance to wander after shopping
    WANDER_TIME_MIN: 10000, // 10 seconds minimum wandering
    WANDER_TIME_MAX: 60000, // 60 seconds maximum wandering
    BREAK_ROOM_COST: 300, // Cost to build break room
    BREAK_ROOM_ITEMS: {
        'breakroom-coffee': { name: 'Coffee Machine', cost: 150, qualityBoost: 0.15, icon: '☕' },
        'breakroom-vending': { name: 'Vending Machine', cost: 100, qualityBoost: 0.1, icon: '🥤' },
        'breakroom-table': { name: 'Table', cost: 80, qualityBoost: 0.08, icon: '🪑' },
        'breakroom-sofa': { name: 'Sofa', cost: 120, qualityBoost: 0.12, icon: '🛋️' },
        'breakroom-tv': { name: 'TV', cost: 200, qualityBoost: 0.2, icon: '📺' }
    },
    JANITOR_BREAK_CHANCE: 0.3, // 30% chance to take break when idle and no work
    JANITOR_BREAK_TIME: 10000, // 10 seconds break time
    JANITOR_BREAK_COOLDOWN: 30000, // 30 seconds cooldown between breaks
    KITCHEN_COST: 400, // Cost to build kitchen
    KITCHEN_ITEMS: {
        'kitchen-stove': { name: 'Stove', cost: 200, qualityBoost: 0.3, icon: '🔥', required: true },
        'kitchen-fridge': { name: 'Fridge', cost: 150, qualityBoost: 0.15, icon: '❄️' },
        'kitchen-counter': { name: 'Counter', cost: 100, qualityBoost: 0.1, icon: '🪑' },
        'kitchen-sink': { name: 'Sink', cost: 120, qualityBoost: 0.12, icon: '🚰' },
        'kitchen-oven': { name: 'Oven', cost: 250, qualityBoost: 0.25, icon: '🔥' }
    },
    CHEF_COST: 600, // Cost to hire chef
    CHEF_COOK_TIME: 10000, // 10 seconds to cook
    CHEF_COOK_COOLDOWN: 30000, // 30 seconds cooldown between cooking
    CHEF_BASE_PAYMENT: 20, // Base payment from customers
    CHEF_PAYMENT_MULTIPLIER: 0.5 // Payment multiplier per quality point
};

// Game State
const gameState = {
    money: CONFIG.INITIAL_MONEY,
    day: 1,
    dayStartTime: Date.now(),
    selectedBuildType: null,
    camera: { x: 0, y: 0, zoom: 1.5 },
    grid: new Map(),
    shops: [],
    customers: [],
    entrances: [],
    dailyIncome: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    review: 3.0, // 0-5 stars
    decorations: [],
    utilities: [], // Customer Service, etc.
    spills: [],
    janitors: [],
    events: [],
    lastEventTime: Date.now(),
    lastJanitorPay: Date.now(),
    currentFloor: 0, // Current floor being viewed
    floors: [0], // Array of floor numbers (starts with floor 0)
    hospitalStaff: [], // Hospital staff for rescuing injured customers
    selectedCustomer: null, // Selected customer for info panel
    tutorial: {
        active: true,
        currentStep: 0,
        completed: []
    },
    loyaltyCardHolders: new Map(), // Track customers with loyalty cards (customerId -> visitCount)
    currentSaveSlot: 1, // Current save slot (1-5)
    miniMapVisible: false,
    breakRooms: [], // Break rooms for employees
    kitchens: [], // Kitchens for chefs
    chefs: [] // Chefs for cooking food
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Also resize after a short delay to ensure layout is complete
setTimeout(resizeCanvas, 100);

// Grid Functions
function worldToGrid(x, y) {
    const gridX = Math.floor((x - gameState.camera.x) / (CONFIG.GRID_SIZE * gameState.camera.zoom));
    const gridY = Math.floor((y - gameState.camera.y) / (CONFIG.GRID_SIZE * gameState.camera.zoom));
    return { x: gridX, y: gridY };
}

function gridToWorld(gridX, gridY) {
    const x = gridX * CONFIG.GRID_SIZE * gameState.camera.zoom + gameState.camera.x;
    const y = gridY * CONFIG.GRID_SIZE * gameState.camera.zoom + gameState.camera.y;
    return { x, y };
}

function getGridKey(x, y) {
    return `${x},${y}`;
}

// Building Functions
function canPlaceBuilding(gridX, gridY, type) {
    const key = getGridKey(gridX, gridY);
    
    if (type === 'floor') {
        // Floors can be placed on empty tiles
        return !gameState.grid.has(key);
    }
    
    if (type === 'entrance') {
        // Entrances can only be placed on floor 0
        if (gameState.currentFloor !== 0) {
            return false;
        }
        return !gameState.grid.has(key);
    }
    
    // Shops need a floor and no decoration
    if (type.startsWith('shop-')) {
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            // Check if there's a decoration here
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY);
            return !hasDecoration;
        }
        return false;
    }
    
    // Decorations need a floor
    if (type.startsWith('decoration-')) {
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            // Check if there's already a decoration here
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY);
            return !hasDecoration;
        }
        return false;
    }
    
    // Janitors need a floor and no decoration
    if (type === 'janitor') {
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            // Check if there's a decoration here
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY);
            return !hasDecoration;
        }
        return false;
    }
    
    // Utilities need a floor and no decoration/shop
    if (type.startsWith('utility-')) {
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            // Check if there's a decoration or shop here
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY && d.floor === gameState.currentFloor);
            const hasShop = gameState.shops.some(s => s.x === gridX && s.y === gridY && s.floor === gameState.currentFloor);
            const hasUtility = gameState.utilities.some(u => u.x === gridX && u.y === gridY && u.floor === gameState.currentFloor);
            return !hasDecoration && !hasShop && !hasUtility;
        }
        return false;
    }
    
    // Stairs need a floor and no decoration/shop
    if (type === 'stairs') {
        // Check if unlocked (day 5+)
        if (gameState.day < CONFIG.STAIRS_UNLOCK_DAY) {
            return false;
        }
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY && d.floor === gameState.currentFloor);
            const hasShop = gameState.shops.some(s => s.x === gridX && s.y === gridY && s.floor === gameState.currentFloor);
            const hasStairs = gameState.utilities.some(u => u.type === 'stairs' && u.x === gridX && u.y === gridY && u.floor === gameState.currentFloor);
            return !hasDecoration && !hasShop && !hasStairs;
        }
        return false;
    }
    
    // Elevators need a floor, no decoration/shop, and stairs must exist
    if (type === 'elevator') {
        // Check if stairs exist (any floor)
        const hasStairs = gameState.utilities.some(u => u.type === 'stairs');
        if (!hasStairs) {
            return false;
        }
        // Check if elevator already exists on this floor
        const hasElevatorOnFloor = gameState.utilities.some(u => u.type === 'elevator' && u.floor === gameState.currentFloor);
        if (hasElevatorOnFloor) {
            return false; // Only 1 elevator per floor
        }
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY && d.floor === gameState.currentFloor);
            const hasShop = gameState.shops.some(s => s.x === gridX && s.y === gridY && s.floor === gameState.currentFloor);
            return !hasDecoration && !hasShop;
        }
        return false;
    }
    
    // Break rooms need a 4x3 area of floor tiles with no decoration/shop/utility
    if (type === 'breakroom') {
        const width = 4;
        const height = 3;
        
        // Check all tiles in 4x3 area
        for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < height; dy++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;
                const checkKey = getGridKey(checkX, checkY);
                const existing = gameState.grid.get(checkKey);
                
                if (!existing || existing.type !== 'floor') {
                    return false; // All tiles must be floor
                }
                
                // Check for conflicts
                const hasDecoration = gameState.decorations.some(d => d.x === checkX && d.y === checkY && d.floor === gameState.currentFloor);
                const hasShop = gameState.shops.some(s => s.x === checkX && s.y === checkY && s.floor === gameState.currentFloor);
                const hasUtility = gameState.utilities.some(u => u.x === checkX && u.y === checkY && u.floor === gameState.currentFloor);
                const hasBreakRoom = gameState.breakRooms.some(br => {
                    // Check if this tile is within any existing break room's 4x3 area
                    return checkX >= br.x && checkX < br.x + 4 && checkY >= br.y && checkY < br.y + 3 && br.floor === gameState.currentFloor;
                });
                
                if (hasDecoration || hasShop || hasUtility || hasBreakRoom) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Break room items can only be placed inside break rooms (3x4 area)
    if (type.startsWith('breakroom-')) {
        // Check if this location is within any break room's 3x4 area
        const breakRoom = gameState.breakRooms.find(br => {
            return gridX >= br.x && gridX < br.x + 3 && gridY >= br.y && gridY < br.y + 4 && br.floor === gameState.currentFloor;
        });
        if (!breakRoom) {
            return false; // Must be inside a break room
        }
        // Check if there's already an item here
        const hasItem = breakRoom.items && breakRoom.items.some(item => item.x === gridX && item.y === gridY);
        return !hasItem;
    }
    
    // Kitchens need a 3x4 area of floor tiles with no decoration/shop/utility
    if (type === 'kitchen') {
        const width = 3;
        const height = 4;
        
        // Check all tiles in 3x4 area
        for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < height; dy++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;
                const checkKey = getGridKey(checkX, checkY);
                const existing = gameState.grid.get(checkKey);
                
                if (!existing || existing.type !== 'floor') {
                    return false; // All tiles must be floor
                }
                
                // Check for conflicts
                const hasDecoration = gameState.decorations.some(d => d.x === checkX && d.y === checkY && d.floor === gameState.currentFloor);
                const hasShop = gameState.shops.some(s => s.x === checkX && s.y === checkY && s.floor === gameState.currentFloor);
                const hasUtility = gameState.utilities.some(u => u.x === checkX && u.y === checkY && u.floor === gameState.currentFloor);
                const hasBreakRoom = gameState.breakRooms.some(br => {
                    return checkX >= br.x && checkX < br.x + 4 && checkY >= br.y && checkY < br.y + 3 && br.floor === gameState.currentFloor;
                });
                const hasKitchen = gameState.kitchens.some(k => {
                    return checkX >= k.x && checkX < k.x + 3 && checkY >= k.y && checkY < k.y + 4 && k.floor === gameState.currentFloor;
                });
                
                if (hasDecoration || hasShop || hasUtility || hasBreakRoom || hasKitchen) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Kitchen items can only be placed inside kitchens (3x4 area)
    if (type.startsWith('kitchen-')) {
        // Check if this location is within any kitchen's 3x4 area
        const kitchen = gameState.kitchens.find(k => {
            return gridX >= k.x && gridX < k.x + 3 && gridY >= k.y && gridY < k.y + 4 && k.floor === gameState.currentFloor;
        });
        if (!kitchen) {
            return false; // Must be inside a kitchen
        }
        // Check if there's already an item here
        const hasItem = kitchen.items && kitchen.items.some(item => item.x === gridX && item.y === gridY);
        return !hasItem;
    }
    
    // Chefs need a floor and no decoration
    if (type === 'chef') {
        const existing = gameState.grid.get(key);
        if (existing && existing.type === 'floor') {
            // Check if there's a decoration here
            const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY);
            return !hasDecoration;
        }
        return false;
    }
    
    return false;
}

function placeBuilding(gridX, gridY, type) {
    if (!canPlaceBuilding(gridX, gridY, type)) {
        return false;
    }
    
    const key = getGridKey(gridX, gridY);
    
    if (type === 'floor') {
        if (gameState.money < 50) return false;
        gameState.money -= 50;
        gameState.grid.set(key, { type: 'floor', x: gridX, y: gridY });
        return true;
    }
    
    if (type === 'entrance') {
        // Entrances can only be placed on floor 0
        if (gameState.currentFloor !== 0) {
            return false;
        }
        
        // Calculate entrance cost (first is free, then $200 + $50 per existing entrance)
        let entranceCost = 0;
        if (gameState.entrances.length > 0) {
            entranceCost = CONFIG.ENTRANCE_BASE_COST + (gameState.entrances.length * CONFIG.ENTRANCE_COST_INCREMENT);
        }
        
        if (gameState.money < entranceCost) {
            return false;
        }
        
        gameState.money -= entranceCost;
        gameState.entrances.push({ x: gridX, y: gridY, floor: 0 });
        gameState.grid.set(key, { type: 'entrance', x: gridX, y: gridY, floor: 0 });
        return true;
    }
    
    if (type.startsWith('shop-')) {
        const shopConfig = CONFIG.SHOP_TYPES[type];
        if (!shopConfig || gameState.money < shopConfig.cost) {
            return false;
        }
        
        gameState.money -= shopConfig.cost;
        const shop = {
            id: Date.now() + Math.random(),
            type: type,
            name: shopConfig.name,
            x: gridX,
            y: gridY,
            floor: gameState.currentFloor,
            income: shopConfig.income,
            color: shopConfig.color,
            customers: 0,
            maxCapacity: shopConfig.maxCustomers || CONFIG.MAX_SHOP_CAPACITY,
            popularity: shopConfig.popularity || 0.8,
            efficiency: shopConfig.efficiency || 0.7,
            baseIncome: shopConfig.income
        };
        
        gameState.shops.push(shop);
        gameState.grid.set(key, { type: 'shop', shop: shop, x: gridX, y: gridY, floor: gameState.currentFloor });
        updateShopList();
        updateReview();
        return true;
    }
    
    if (type.startsWith('decoration-')) {
        const decConfig = CONFIG.DECORATION_TYPES[type];
        if (!decConfig || gameState.money < decConfig.cost) {
            return false;
        }
        
        gameState.money -= decConfig.cost;
        const decoration = {
            id: Date.now() + Math.random(),
            type: type,
            name: decConfig.name,
            x: gridX,
            y: gridY,
            floor: gameState.currentFloor,
            reviewBoost: decConfig.reviewBoost,
            color: decConfig.color,
            isBench: type === 'decoration-bench',
            customersUsing: 0,
            spillReduction: decConfig.spillReduction || 0,
            rotation: 0, // 0, 90, 180, 270 degrees for benches
            trashLevel: 0, // For trash bins
            maxCapacity: type === 'decoration-trashbin' ? CONFIG.TRASH_BIN_CAPACITY : 0,
            seatPositions: type === 'decoration-bench' ? [
                { x: 0.3, y: 0.5, occupied: false },
                { x: 0.7, y: 0.5, occupied: false }
            ] : []
        };
        
        gameState.decorations.push(decoration);
        updateReview();
        return true;
    }
    
    if (type === 'janitor') {
        // Janitors can be placed on floors (not on shops or decorations)
        const existing = gameState.grid.get(key);
        if (!existing || existing.type !== 'floor') {
            return false;
        }
        
        // Check if there's a decoration here
        const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY);
        if (hasDecoration) {
            return false;
        }
        
        if (gameState.money < CONFIG.JANITOR_COST) {
            return false;
        }
        
        gameState.money -= CONFIG.JANITOR_COST;
        const janitor = {
            id: Date.now() + Math.random(),
            x: gridX,
            y: gridY,
            targetSpill: null,
            cleaningProgress: 0,
            state: 'idle', // idle, moving, cleaning, emptying, going-to-breakroom, going-to-breakroom-item, resting
            path: [],
            pathIndex: 0,
            targetX: gridX,
            targetY: gridY,
            breakRoomBoost: 0, // Performance boost from break room (0-1)
            breakRoomBoostStartTime: 0, // When the boost started
            lastBreakTime: 0, // Last time janitor took a break
            targetBreakRoom: null,
            targetBreakRoomItem: null, // Item they're interacting with
            restTimer: 0,
            restTime: 0,
            assignedFloor: null, // null = all floors, or specific floor number
            name: `Janitor ${gameState.janitors.length + 1}`,
            tasksCompleted: 0 // Track performance
        };
        
        gameState.janitors.push(janitor);
        return true;
    }
    
    if (type.startsWith('utility-')) {
        if (type === 'utility-customerservice') {
            // Check if unlocked (day 2+)
            if (gameState.day < CONFIG.CUSTOMER_SERVICE_UNLOCK_DAY) {
                return false;
            }
            
            // Check if max reached
            const existingServices = gameState.utilities.filter(u => u.type === 'utility-customerservice');
            if (existingServices.length >= CONFIG.CUSTOMER_SERVICE_MAX) {
                return false;
            }
            
            // Check cost
            if (gameState.money < CONFIG.CUSTOMER_SERVICE_COST) {
                return false;
            }
            
            gameState.money -= CONFIG.CUSTOMER_SERVICE_COST;
            const utility = {
                id: Date.now() + Math.random(),
                type: 'utility-customerservice',
                name: 'Customer Service',
                x: gridX,
                y: gridY,
                floor: gameState.currentFloor,
                color: '#9b59b6'
            };
            
            gameState.utilities.push(utility);
            gameState.grid.set(key, { type: 'utility', utility: utility, x: gridX, y: gridY, floor: gameState.currentFloor });
            return true;
        }
    }
    
    if (type === 'stairs') {
        if (gameState.money < CONFIG.STAIRS_COST) {
            return false;
        }
        
        gameState.money -= CONFIG.STAIRS_COST;
        const stairs = {
            id: Date.now() + Math.random(),
            type: 'stairs',
            name: 'Stairs',
            x: gridX,
            y: gridY,
            floor: gameState.currentFloor,
            color: '#8b7355'
        };
        
        gameState.utilities.push(stairs);
        gameState.grid.set(key, { type: 'utility', utility: stairs, x: gridX, y: gridY, floor: gameState.currentFloor });
        
        // Create new floor if this is the first stairs on this floor
        const nextFloor = gameState.currentFloor + 1;
        if (!gameState.floors.includes(nextFloor)) {
            gameState.floors.push(nextFloor);
        }
        
        return true;
    }
    
    if (type === 'elevator') {
        if (gameState.money < CONFIG.ELEVATOR_COST) {
            return false;
        }
        
        gameState.money -= CONFIG.ELEVATOR_COST;
        const elevator = {
            id: Date.now() + Math.random(),
            type: 'elevator',
            name: 'Elevator',
            x: gridX,
            y: gridY,
            floor: gameState.currentFloor,
            color: '#c0c0c0'
        };
        
        gameState.utilities.push(elevator);
        gameState.grid.set(key, { type: 'utility', utility: elevator, x: gridX, y: gridY, floor: gameState.currentFloor });
        updateReview(); // Elevators boost reviews
        return true;
    }
    
    if (type === 'breakroom') {
        if (gameState.money < CONFIG.BREAK_ROOM_COST) {
            return false;
        }
        
        gameState.money -= CONFIG.BREAK_ROOM_COST;
        const breakRoom = {
            id: Date.now() + Math.random(),
            type: 'breakroom',
            name: 'Break Room',
            x: gridX,
            y: gridY,
            width: 4,
            height: 3,
            floor: gameState.currentFloor,
            color: '#8b4513',
            items: [] // Items inside the break room
        };
        
        // Mark all 4x3 tiles as breakroom
        for (let dx = 0; dx < 4; dx++) {
            for (let dy = 0; dy < 3; dy++) {
                const tileX = gridX + dx;
                const tileY = gridY + dy;
                const tileKey = getGridKey(tileX, tileY);
                gameState.grid.set(tileKey, { type: 'breakroom', breakroom: breakRoom, x: tileX, y: tileY, floor: gameState.currentFloor });
            }
        }
        
        gameState.breakRooms.push(breakRoom);
        return true;
    }
    
    if (type.startsWith('breakroom-')) {
        const itemConfig = CONFIG.BREAK_ROOM_ITEMS[type];
        if (!itemConfig) return false;
        
        if (gameState.money < itemConfig.cost) {
            return false;
        }
        
        // Find the break room that contains this location (4x3 area)
        const breakRoom = gameState.breakRooms.find(br => {
            return gridX >= br.x && gridX < br.x + 4 && gridY >= br.y && gridY < br.y + 3 && br.floor === gameState.currentFloor;
        });
        if (!breakRoom) {
            return false; // Must be inside a break room
        }
        
        gameState.money -= itemConfig.cost;
        const item = {
            id: Date.now() + Math.random(),
            type: type,
            name: itemConfig.name,
            x: gridX,
            y: gridY,
            qualityBoost: itemConfig.qualityBoost,
            icon: itemConfig.icon
        };
        
        if (!breakRoom.items) breakRoom.items = [];
        breakRoom.items.push(item);
        return true;
    }
    
    if (type === 'kitchen') {
        if (gameState.money < CONFIG.KITCHEN_COST) {
            return false;
        }
        
        gameState.money -= CONFIG.KITCHEN_COST;
        const kitchen = {
            id: Date.now() + Math.random(),
            type: 'kitchen',
            name: 'Kitchen',
            x: gridX,
            y: gridY,
            width: 3,
            height: 4,
            floor: gameState.currentFloor,
            color: '#ff6b6b',
            items: [] // Items inside the kitchen
        };
        
        // Mark all 3x4 tiles as kitchen
        for (let dx = 0; dx < 3; dx++) {
            for (let dy = 0; dy < 4; dy++) {
                const tileX = gridX + dx;
                const tileY = gridY + dy;
                const tileKey = getGridKey(tileX, tileY);
                gameState.grid.set(tileKey, { type: 'kitchen', kitchen: kitchen, x: tileX, y: tileY, floor: gameState.currentFloor });
            }
        }
        
        gameState.kitchens.push(kitchen);
        return true;
    }
    
    if (type.startsWith('kitchen-')) {
        const itemConfig = CONFIG.KITCHEN_ITEMS[type];
        if (!itemConfig) return false;
        
        if (gameState.money < itemConfig.cost) {
            return false;
        }
        
        // Find the kitchen that contains this location (3x4 area)
        const kitchen = gameState.kitchens.find(k => {
            return gridX >= k.x && gridX < k.x + 3 && gridY >= k.y && gridY < k.y + 4 && k.floor === gameState.currentFloor;
        });
        if (!kitchen) {
            return false; // Must be inside a kitchen
        }
        
        gameState.money -= itemConfig.cost;
        const item = {
            id: Date.now() + Math.random(),
            type: type,
            name: itemConfig.name,
            x: gridX,
            y: gridY,
            qualityBoost: itemConfig.qualityBoost,
            icon: itemConfig.icon,
            required: itemConfig.required || false
        };
        
        if (!kitchen.items) kitchen.items = [];
        kitchen.items.push(item);
        return true;
    }
    
    if (type === 'chef') {
        // Chefs can be placed on floors (not on shops or decorations)
        const existing = gameState.grid.get(key);
        if (!existing || existing.type !== 'floor') {
            return false;
        }
        
        // Check if there's a decoration here
        const hasDecoration = gameState.decorations.some(d => d.x === gridX && d.y === gridY);
        if (hasDecoration) {
            return false;
        }
        
        if (gameState.money < CONFIG.CHEF_COST) {
            return false;
        }
        
        gameState.money -= CONFIG.CHEF_COST;
        const chef = {
            id: Date.now() + Math.random(),
            x: gridX,
            y: gridY,
            targetKitchen: null,
            targetCustomer: null,
            cookingProgress: 0,
            lastCookTime: 0,
            state: 'idle', // idle, going-to-kitchen, cooking, going-to-customer, delivering, going-to-rest, resting
            path: [],
            pathIndex: 0,
            targetX: gridX,
            targetY: gridY,
            hasFood: false, // Whether chef is carrying food
            assignedFloor: null, // null = all floors, or specific floor number
            assignedKitchen: null, // null = any kitchen, or specific kitchen ID
            name: `Chef ${gameState.chefs.length + 1}`,
            mealsCooked: 0 // Track performance
        };
        
        gameState.chefs.push(chef);
        return true;
    }
    
    return false;
}

// Pathfinding (A* algorithm)
function findPath(start, end) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = getGridKey(start.x, start.y);
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, end));
    
    while (openSet.length > 0) {
        let current = openSet[0];
        let currentIndex = 0;
        
        for (let i = 1; i < openSet.length; i++) {
            const currentKey = getGridKey(current.x, current.y);
            const openKey = getGridKey(openSet[i].x, openSet[i].y);
            if ((fScore.get(openKey) || Infinity) < (fScore.get(currentKey) || Infinity)) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        
        openSet.splice(currentIndex, 1);
        const currentKey = getGridKey(current.x, current.y);
        closedSet.add(currentKey);
        
        if (current.x === end.x && current.y === end.y) {
            const path = [];
            let node = current;
            while (node) {
                path.unshift(node);
                node = cameFrom.get(getGridKey(node.x, node.y));
            }
            return path;
        }
        
        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];
        
        for (const neighbor of neighbors) {
            const neighborKey = getGridKey(neighbor.x, neighbor.y);
            if (closedSet.has(neighborKey)) continue;
            
            const tile = gameState.grid.get(neighborKey);
            // Customers cannot path through kitchens or break rooms - only floors, shops, and entrances
            if (!tile || (tile.type !== 'floor' && tile.type !== 'shop' && tile.type !== 'entrance')) {
                continue;
            }
            
            // Also check if this tile is inside a kitchen or break room (block pathfinding)
            const isInKitchen = gameState.kitchens.some(k => {
                return neighbor.x >= k.x && neighbor.x < k.x + k.width && 
                       neighbor.y >= k.y && neighbor.y < k.y + k.height;
            });
            const isInBreakRoom = gameState.breakRooms.some(br => {
                return neighbor.x >= br.x && neighbor.x < br.x + br.width && 
                       neighbor.y >= br.y && neighbor.y < br.y + br.height;
            });
            
            if (isInKitchen || isInBreakRoom) {
                continue; // Block pathfinding through these zones
            }
            
            const tentativeGScore = (gScore.get(currentKey) || 0) + 1;
            const neighborGScore = gScore.get(neighborKey) || Infinity;
            
            if (tentativeGScore < neighborGScore) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
                
                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    return null; // No path found
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Calculate max customers based on base + Customer Services
function getMaxCustomers() {
    let maxCustomers = CONFIG.BASE_MAX_CUSTOMERS;
    // Add 5 customers per Customer Service
    const customerServices = gameState.utilities.filter(u => u.type === 'utility-customerservice');
    maxCustomers += customerServices.length * CONFIG.CUSTOMER_SERVICE_CAPACITY;
    return maxCustomers;
}

// Customer System
function spawnCustomer() {
    if (gameState.entrances.length === 0) return;
    
    // Check mall capacity
    const maxCustomers = getMaxCustomers();
    if (gameState.customers.length >= maxCustomers) return;
    
    const entrance = gameState.entrances[Math.floor(Math.random() * gameState.entrances.length)];
    
    if (gameState.shops.length === 0) return;
    
    // Smarter shop selection - prefer shops with fewer customers, visit multiple shops
    const availableShops = gameState.shops.filter(s => s.customers < s.maxCapacity);
    if (availableShops.length === 0) return;
    
    // Create a shopping list (1-3 shops)
    const shopCount = Math.min(1 + Math.floor(Math.random() * 3), availableShops.length);
    const shoppingList = [];
    const usedShops = new Set();
    
    for (let i = 0; i < shopCount; i++) {
        // Prefer shops with fewer customers
        const sortedShops = [...availableShops]
            .filter(s => !usedShops.has(s.id))
            .sort((a, b) => a.customers - b.customers);
        
        if (sortedShops.length === 0) break;
        
        // Weighted random selection favoring less crowded shops
        const weights = sortedShops.map(s => 4 - s.customers);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        let selectedShop = sortedShops[0];
        for (let j = 0; j < sortedShops.length; j++) {
            random -= weights[j];
            if (random <= 0) {
                selectedShop = sortedShops[j];
                break;
            }
        }
        
        shoppingList.push(selectedShop);
        usedShops.add(selectedShop.id);
    }
    
    if (shoppingList.length === 0) return;
    
    // Find path to first shop
    const firstShop = shoppingList[0];
    const path = findPath(entrance, { x: firstShop.x, y: firstShop.y });
    
    if (!path || path.length === 0) return;
    
    // Convert grid path to continuous grid coordinates (with fractional positions)
    const continuousPath = path.map((p, i) => {
        // Add random offset within tile for smooth movement
        const offsetX = 0.2 + Math.random() * 0.6; // 20% to 80% of tile
        const offsetY = 0.2 + Math.random() * 0.6;
        return { 
            x: p.x + offsetX,
            y: p.y + offsetY
        };
    });
    
    // 3% chance to spawn disabled
    const isDisabled = Math.random() < CONFIG.DISABLED_SPAWN_CHANCE;
    const customerName = CONFIG.CUSTOMER_NAMES[Math.floor(Math.random() * CONFIG.CUSTOMER_NAMES.length)];
    
    // 1% chance customer spawns with loyalty card
    let hasLoyaltyCard = Math.random() < CONFIG.LOYALTY_CARD_SPAWN_CHANCE;
    let visitCount = 0;
    
    if (hasLoyaltyCard) {
        // If they have a loyalty card, check if they're a returning customer
        if (gameState.loyaltyCardHolders.has(customerName)) {
            visitCount = gameState.loyaltyCardHolders.get(customerName) + 1;
            gameState.loyaltyCardHolders.set(customerName, visitCount);
        } else {
            // New loyalty card holder
            visitCount = 1;
            gameState.loyaltyCardHolders.set(customerName, visitCount);
        }
    } else {
        // Track for potential future loyalty card
        if (!gameState.loyaltyCardHolders.has(customerName)) {
            gameState.loyaltyCardHolders.set(customerName, 0);
        }
    }
    
    // 2% chance to spawn as family (2 customers together)
    const isFamily = Math.random() < CONFIG.FAMILY_SPAWN_CHANCE;
    
    // Use shopping list as-is (no group preferences)
    const finalShoppingList = shoppingList;
    
    // Default customer speed
    const baseSpeed = 0.8 + Math.random() * 0.4;
    
    const customer = {
        id: Date.now() + Math.random(),
        name: customerName,
        x: continuousPath[0].x,
        y: continuousPath[0].y,
        floor: 0, // Start on floor 0
        shoppingList: finalShoppingList,
        currentShopIndex: 0,
        path: continuousPath,
        pathIndex: 0,
        state: 'walking', // walking, shopping, leaving, resting, injured, wandering
        shoppingTime: 2000 + Math.random() * 3000,
        color: CONFIG.CUSTOMER_COLORS[Math.floor(Math.random() * CONFIG.CUSTOMER_COLORS.length)],
        speed: isDisabled ? baseSpeed * CONFIG.DISABLED_SPEED_MULTIPLIER : baseSpeed, // Slower if disabled
        targetX: 0,
        targetY: 0,
        conversation: null,
        conversationTimer: 0,
        conversationDuration: 0,
        disabled: isDisabled,
        injured: false, // Broken legs from stairs
        thought: null,
        loyaltyCard: hasLoyaltyCard,
        visitCount: visitCount,
        familyId: isFamily ? Date.now() + Math.random() : null, // Family members share same ID
        familyMember: isFamily ? 1 : null // 1 or 2 for family members
    };
    
    // If this is a regular customer, update their thought
    if (hasLoyaltyCard && visitCount > 0) {
        customer.thought = 'Back again!';
    }
    
    if (customer.path.length > 0) {
        customer.targetX = customer.path[0].x;
        customer.targetY = customer.path[0].y;
    }
    
    gameState.customers.push(customer);
    
    // If family, spawn second family member nearby
    if (isFamily) {
        const familyMember2 = {
            id: Date.now() + Math.random(),
            name: CONFIG.CUSTOMER_NAMES[Math.floor(Math.random() * CONFIG.CUSTOMER_NAMES.length)],
            x: continuousPath[0].x + (Math.random() - 0.5) * 0.5,
            y: continuousPath[0].y + (Math.random() - 0.5) * 0.5,
            floor: 0,
            shoppingList: finalShoppingList,
            currentShopIndex: 0,
            path: continuousPath.map(p => ({ x: p.x + (Math.random() - 0.5) * 0.3, y: p.y + (Math.random() - 0.5) * 0.3 })),
            pathIndex: 0,
            state: 'walking',
            shoppingTime: 2000 + Math.random() * 3000,
            color: CONFIG.CUSTOMER_COLORS[Math.floor(Math.random() * CONFIG.CUSTOMER_COLORS.length)],
            speed: baseSpeed * 0.9, // Slightly slower to stay together
            targetX: 0,
            targetY: 0,
            conversation: null,
            conversationTimer: 0,
            conversationDuration: 0,
            disabled: false,
            injured: false,
            thought: null,
            loyaltyCard: hasLoyaltyCard,
            visitCount: visitCount,
            familyId: customer.familyId, // Same family ID
            familyMember: 2
        };
        
        if (familyMember2.path.length > 0) {
            familyMember2.targetX = familyMember2.path[0].x;
            familyMember2.targetY = familyMember2.path[0].y;
        }
        
        gameState.customers.push(familyMember2);
    }
}

function isOnFloor(gridX, gridY) {
    const key = getGridKey(Math.floor(gridX), Math.floor(gridY));
    const tile = gameState.grid.get(key);
    // Customers can walk on floors, shops, entrances, kitchens, and break rooms
    return tile && (tile.type === 'floor' || tile.type === 'shop' || tile.type === 'entrance' || tile.type === 'kitchen' || tile.type === 'breakroom');
}

function getRandomPositionInTile(gridX, gridY) {
    // Return random position within tile (grid coordinates with fractions)
    return {
        x: gridX + 0.2 + Math.random() * 0.6,
        y: gridY + 0.2 + Math.random() * 0.6
    };
}

// Customer Collision Avoidance
function avoidCollisions(customer, deltaSeconds) {
    let avoidX = 0;
    let avoidY = 0;
    
    for (const other of gameState.customers) {
        if (other.id === customer.id) continue;
        if (other.state === 'resting' || other.state === 'shopping') continue;
        
        const dx = other.x - customer.x;
        const dy = other.y - customer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < CONFIG.CUSTOMER_COLLISION_RADIUS && dist > 0) {
            // Push away from other customer
            const force = CONFIG.CUSTOMER_AVOIDANCE_FORCE / (dist + 0.1);
            avoidX -= (dx / dist) * force;
            avoidY -= (dy / dist) * force;
        }
    }
    
    return { x: avoidX, y: avoidY };
}

function updateCustomers(deltaTime) {
    const deltaSeconds = deltaTime / 1000; // Convert to seconds
    
    for (let i = gameState.customers.length - 1; i >= 0; i--) {
        const customer = gameState.customers[i];
        
        // Injured customers don't move (hospital staff handles them)
        if (customer.injured && customer.state === 'injured') {
            continue;
        }
        
        // Handle wandering customers (after shopping)
        if (customer.state === 'wandering') {
            customer.wanderTimer += deltaTime;
            
            // Check if reached current target
            const dx = customer.targetX - customer.x;
            const dy = customer.targetY - customer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                customer.pathIndex++;
                
                if (customer.pathIndex >= customer.path.length || customer.wanderTimer >= customer.wanderTime) {
                    // Done wandering, leave
                    customer.state = 'leaving';
                    const entrance = gameState.entrances[0];
                    const gridX = Math.floor(customer.x);
                    const gridY = Math.floor(customer.y);
                    const path = findPath({ x: gridX, y: gridY }, entrance) || [];
                    if (path.length > 0) {
                        customer.path = path.map((p, idx) => {
                            const offsetX = 0.2 + Math.random() * 0.6;
                            const offsetY = 0.2 + Math.random() * 0.6;
                            return { 
                                x: p.x + offsetX,
                                y: p.y + offsetY
                            };
                        });
                        customer.pathIndex = 0;
                        if (customer.path.length > 0) {
                            customer.targetX = customer.path[0].x;
                            customer.targetY = customer.path[0].y;
                        }
                    } else {
                        gameState.customers.splice(i, 1);
                        continue;
                    }
                } else {
                    customer.targetX = customer.path[customer.pathIndex].x;
                    customer.targetY = customer.path[customer.pathIndex].y;
                }
            } else {
                // Move towards target
                const speed = customer.speed * deltaSeconds;
                let moveX = (dx / distance) * speed;
                let moveY = (dy / distance) * speed;
                
                // Apply collision avoidance
                const avoidance = avoidCollisions(customer, deltaSeconds);
                moveX += avoidance.x * deltaSeconds;
                moveY += avoidance.y * deltaSeconds;
                
                customer.x += moveX;
                customer.y += moveY;
            }
            continue;
        }
        
        if (customer.state === 'walking' || customer.state === 'resting') {
            if (customer.state === 'resting') {
                // Customer is resting on bench, don't move
                continue;
            }
            // Check if reached current target
            const dx = customer.targetX - customer.x;
            const dy = customer.targetY - customer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                // Reached waypoint, move to next
                customer.pathIndex++;
                
                if (customer.pathIndex >= customer.path.length) {
                    // Reached shop
                    if (customer.shoppingList.length === 0) {
                        // No shopping list, leave
                        customer.state = 'leaving';
                        const entrance = gameState.entrances[0];
                        const gridX = Math.floor(customer.x);
                        const gridY = Math.floor(customer.y);
                        const path = findPath({ x: gridX, y: gridY }, entrance) || [];
                        if (path.length > 0) {
                            customer.path = path.map((p, idx) => {
                                const offsetX = 0.2 + Math.random() * 0.6;
                                const offsetY = 0.2 + Math.random() * 0.6;
                                return { 
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                };
                            });
                            customer.pathIndex = 0;
                            if (customer.path.length > 0) {
                                customer.targetX = customer.path[0].x;
                                customer.targetY = customer.path[0].y;
                            }
                        } else {
                            gameState.customers.splice(i, 1);
                        }
                        continue;
                    }
                    
                    const currentShop = customer.shoppingList[customer.currentShopIndex];
                    // Check shop capacity
                    if (currentShop.customers >= currentShop.maxCapacity) {
                        // Shop is full, skip to next shop or leave
                        customer.currentShopIndex++;
                if (customer.currentShopIndex >= customer.shoppingList.length) {
                    // Done with all shops - check if they want to wander (based on decorations)
                    const decorationBoost = gameState.decorations.reduce((sum, d) => sum + (d.reviewBoost || 0), 0);
                    const wanderChance = CONFIG.WANDER_AFTER_SHOPPING_CHANCE; // 30% chance to wander
                    
                    if (Math.random() < wanderChance) {
                        // Customer wants to wander - find a random floor tile
                        const floorTiles = [];
                        for (const [key, tile] of gameState.grid.entries()) {
                            if (tile.type === 'floor' && tile.floor === customer.floor) {
                                const [x, y] = key.split(',').map(Number);
                                const dist = Math.sqrt((x - customer.x) ** 2 + (y - customer.y) ** 2);
                                if (dist > 2 && dist < 10) {
                                    floorTiles.push({ x, y });
                                }
                            }
                        }
                        
                        if (floorTiles.length > 0) {
                            const wanderTarget = floorTiles[Math.floor(Math.random() * floorTiles.length)];
                            const gridX = Math.floor(customer.x);
                            const gridY = Math.floor(customer.y);
                            const path = findPath({ x: gridX, y: gridY }, wanderTarget) || [];
                            
                            if (path.length > 0) {
                                customer.path = path.map((p, idx) => {
                                    const offsetX = 0.2 + Math.random() * 0.6;
                                    const offsetY = 0.2 + Math.random() * 0.6;
                                    return { 
                                        x: p.x + offsetX,
                                        y: p.y + offsetY
                                    };
                                });
                                customer.pathIndex = 0;
                                customer.state = 'wandering';
                                customer.wanderTimer = 0;
                                customer.wanderTime = CONFIG.WANDER_TIME_MIN + Math.random() * (CONFIG.WANDER_TIME_MAX - CONFIG.WANDER_TIME_MIN);
                                customer.thought = 'Just looking around...';
                                if (customer.path.length > 0) {
                                    customer.targetX = customer.path[0].x;
                                    customer.targetY = customer.path[0].y;
                                }
                                continue;
                            }
                        }
                    }
                    
                    // If not wandering, leave
                    customer.state = 'leaving';
                            const entrance = gameState.entrances[0];
                            const gridX = Math.floor(customer.x);
                            const gridY = Math.floor(customer.y);
                            const path = findPath({ x: gridX, y: gridY }, entrance) || [];
                            if (path.length > 0) {
                                customer.path = path.map((p, idx) => {
                                    const offsetX = 0.2 + Math.random() * 0.6;
                                    const offsetY = 0.2 + Math.random() * 0.6;
                                    return { 
                                        x: p.x + offsetX,
                                        y: p.y + offsetY
                                    };
                                });
                                customer.pathIndex = 0;
                                if (customer.path.length > 0) {
                                    customer.targetX = customer.path[0].x;
                                    customer.targetY = customer.path[0].y;
                                }
                            } else {
                                gameState.customers.splice(i, 1);
                            }
                        } else {
                            // Go to next shop
                            const nextShop = customer.shoppingList[customer.currentShopIndex];
                            const gridX = Math.floor(customer.x);
                            const gridY = Math.floor(customer.y);
                            const path = findPath({ x: gridX, y: gridY }, { x: nextShop.x, y: nextShop.y }) || [];
                            if (path.length > 0) {
                                customer.path = path.map((p, idx) => {
                                    const offsetX = 0.2 + Math.random() * 0.6;
                                    const offsetY = 0.2 + Math.random() * 0.6;
                                    return { 
                                        x: p.x + offsetX,
                                        y: p.y + offsetY
                                    };
                                });
                                customer.pathIndex = 0;
                                customer.state = 'walking';
                                if (customer.path.length > 0) {
                                    customer.targetX = customer.path[0].x;
                                    customer.targetY = customer.path[0].y;
                                }
                            } else {
                                // Can't reach next shop, leave
                                customer.state = 'leaving';
                                const entrance = gameState.entrances[0];
                                const path = findPath({ x: gridX, y: gridY }, entrance) || [];
                                if (path.length > 0) {
                                    customer.path = path.map((p, idx) => {
                                        const offsetX = 0.2 + Math.random() * 0.6;
                                        const offsetY = 0.2 + Math.random() * 0.6;
                                        return { 
                                            x: p.x + offsetX,
                                            y: p.y + offsetY
                                        };
                                    });
                                    customer.pathIndex = 0;
                                    if (customer.path.length > 0) {
                                        customer.targetX = customer.path[0].x;
                                        customer.targetY = customer.path[0].y;
                                    }
                                } else {
                                    gameState.customers.splice(i, 1);
                                }
                            }
                        }
                        continue;
                    }
                    currentShop.customers++;
                    customer.state = 'shopping';
                    customer.shoppingTimer = 0;
                    // Position customer at shop center with some randomness
                    const shopPos = getRandomPositionInTile(currentShop.x, currentShop.y);
                    customer.x = shopPos.x;
                    customer.y = shopPos.y;
                    continue;
                } else {
                    customer.targetX = customer.path[customer.pathIndex].x;
                    customer.targetY = customer.path[customer.pathIndex].y;
                }
            } else {
                // Move towards target (speed in grid units per second)
                const speed = customer.speed * deltaSeconds;
                let moveX = (dx / distance) * speed;
                let moveY = (dy / distance) * speed;
                
                // Apply collision avoidance
                const avoidance = avoidCollisions(customer, deltaSeconds);
                moveX += avoidance.x * deltaSeconds;
                moveY += avoidance.y * deltaSeconds;
                
                customer.x += moveX;
                customer.y += moveY;
                
                // Family members try to stay together
                if (customer.familyId) {
                    const familyMembers = gameState.customers.filter(c => c.familyId === customer.familyId && c.id !== customer.id);
                    if (familyMembers.length > 0) {
                        const familyMember = familyMembers[0];
                        const familyDx = familyMember.x - customer.x;
                        const familyDy = familyMember.y - customer.y;
                        const familyDist = Math.sqrt(familyDx * familyDx + familyDy * familyDy);
                        
                        // If too far apart, slow down to stay together
                        if (familyDist > 1.5) {
                            customer.speed *= 0.7; // Slow down to let family catch up
                            customer.thought = 'Waiting for family...';
                        } else if (familyDist < 0.5) {
                            customer.thought = null; // Close enough, clear thought
                        }
                    }
                }
                
                // Check if customer is on stairs/elevator and needs to change floors
                const gridX = Math.floor(customer.x);
                const gridY = Math.floor(customer.y);
                const key = getGridKey(gridX, gridY);
                const tile = gameState.grid.get(key);
                
                if (tile && tile.type === 'utility' && tile.utility) {
                    if (tile.utility.type === 'stairs') {
                        // Customer using stairs
                        if (!customer.disabled && !customer.injured) {
                            // 0.3% chance to break legs
                            if (Math.random() < CONFIG.STAIRS_INJURY_CHANCE) {
                                customer.injured = true;
                                customer.state = 'injured';
                                customer.conversation = 'AHHH!';
                                customer.conversationTimer = 0;
                                customer.conversationDuration = 5000;
                                customer.thought = 'My legs! I broke my legs!';
                                // Stop moving
                                customer.path = [];
                                customer.pathIndex = 0;
                            } else {
                                // Change floor (go up or down)
                                const nextFloor = tile.utility.floor + 1;
                                if (gameState.floors.includes(nextFloor)) {
                                    customer.floor = nextFloor;
                                    customer.thought = 'Going up the stairs...';
                                } else if (tile.utility.floor > 0) {
                                    customer.floor = tile.utility.floor - 1;
                                    customer.thought = 'Going down the stairs...';
                                }
                            }
                        }
                    } else if (tile.utility.type === 'elevator') {
                        // Customer using elevator (disabled customers can use elevators)
                        const elevatorsOnOtherFloors = gameState.utilities.filter(u => 
                            u.type === 'elevator' && u.floor !== customer.floor
                        );
                        if (elevatorsOnOtherFloors.length > 0) {
                            // Find target shop on different floor
                            const targetShop = customer.shoppingList.find(s => 
                                s.floor !== customer.floor && 
                                gameState.utilities.some(u => u.type === 'elevator' && u.floor === s.floor)
                            );
                            if (targetShop) {
                                customer.floor = targetShop.floor;
                                customer.thought = 'Taking the elevator...';
                            }
                        }
                    }
                }
                
                // Check if customer is stuck in a kitchen or break room (they shouldn't be there)
                // gridX and gridY already declared above
                const isInKitchen = gameState.kitchens.some(k => {
                    return gridX >= k.x && gridX < k.x + k.width && 
                           gridY >= k.y && gridY < k.y + k.height;
                });
                const isInBreakRoom = gameState.breakRooms.some(br => {
                    return gridX >= br.x && gridX < br.x + br.width && 
                           gridY >= br.y && gridY < br.y + br.height;
                });
                
                // If customer is in a restricted zone, help them exit
                if ((isInKitchen || isInBreakRoom) && customer.state !== 'leaving') {
                    // Find nearest floor tile outside the zone
                    let nearestFloor = null;
                    let nearestDist = Infinity;
                    
                    for (let offset = -3; offset <= 3; offset++) {
                        for (let offsetY = -3; offsetY <= 3; offsetY++) {
                            const checkX = gridX + offset;
                            const checkY = gridY + offsetY;
                            const checkKey = getGridKey(checkX, checkY);
                            const tile = gameState.grid.get(checkKey);
                            
                            // Check if this tile is a valid floor and not in a kitchen/breakroom
                            if (tile && tile.type === 'floor') {
                                const inKitchen = gameState.kitchens.some(k => {
                                    return checkX >= k.x && checkX < k.x + k.width && 
                                           checkY >= k.y && checkY < k.y + k.height;
                                });
                                const inBreakRoom = gameState.breakRooms.some(br => {
                                    return checkX >= br.x && checkX < br.x + br.width && 
                                           checkY >= br.y && checkY < br.y + br.height;
                                });
                                
                                if (!inKitchen && !inBreakRoom) {
                                    const dist = Math.abs(offset) + Math.abs(offsetY);
                                    if (dist < nearestDist) {
                                        nearestDist = dist;
                                        nearestFloor = { x: checkX, y: checkY };
                                    }
                                }
                            }
                        }
                    }
                    
                    if (nearestFloor) {
                        // Path to nearest floor tile outside the zone
                        const path = findPath({ x: gridX, y: gridY }, nearestFloor) || [];
                        if (path.length > 0) {
                            customer.path = path.map((p, idx) => {
                                const offsetX = 0.2 + Math.random() * 0.6;
                                const offsetY = 0.2 + Math.random() * 0.6;
                                return { 
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                };
                            });
                            customer.pathIndex = 0;
                            if (customer.path.length > 0) {
                                customer.targetX = customer.path[0].x;
                                customer.targetY = customer.path[0].y;
                            }
                        } else {
                            // If no path found, teleport to nearest floor
                            const newPos = getRandomPositionInTile(nearestFloor.x, nearestFloor.y);
                            customer.x = newPos.x;
                            customer.y = newPos.y;
                        }
                    }
                }
                
                // Ensure customer stays on floor
                if (!isOnFloor(customer.x, customer.y)) {
                    // Try to find nearest floor tile
                    for (let offset = -1; offset <= 1; offset++) {
                        for (let offsetY = -1; offsetY <= 1; offsetY++) {
                            const checkKey = getGridKey(gridX + offset, gridY + offsetY);
                            const tile = gameState.grid.get(checkKey);
                            if (tile && (tile.type === 'floor' || tile.type === 'shop')) {
                                const newPos = getRandomPositionInTile(gridX + offset, gridY + offsetY);
                                customer.x = newPos.x;
                                customer.y = newPos.y;
                                break;
                            }
                        }
                    }
                }
            }
        } else if (customer.state === 'shopping') {
            customer.shoppingTimer = (customer.shoppingTimer || 0) + deltaTime;
            const currentShop = customer.shoppingList[customer.currentShopIndex];
            
            if (customer.shoppingTimer >= customer.shoppingTime) {
                // Done shopping at this shop
                currentShop.customers--;
                // Calculate income based on shop efficiency and popularity
                // Calculate base income
                let actualIncome = Math.floor(currentShop.baseIncome * currentShop.efficiency * currentShop.popularity);
                
                // Apply chef bonus for food shops (10% per chef, max 70%)
                const currentShopConfig = CONFIG.SHOP_TYPES[currentShop.type];
                if (currentShopConfig && currentShopConfig.category === 'food') {
                    const chefCount = gameState.chefs.length;
                    const chefBonus = Math.min(0.7, chefCount * 0.1); // 10% per chef, max 70%
                    actualIncome = Math.floor(actualIncome * (1 + chefBonus));
                }
                
                // Apply loyalty card bonus
                if (customer.loyaltyCard) {
                    actualIncome = Math.floor(actualIncome * CONFIG.LOYALTY_CARD_BONUS);
                }
                
                gameState.money += actualIncome;
                gameState.dailyIncome += actualIncome;
                
                // Update loyalty card visit count
                if (customer.loyaltyCard) {
                    const newVisitCount = customer.visitCount + 1;
                    gameState.loyaltyCardHolders.set(customer.name, newVisitCount);
                    customer.visitCount = newVisitCount;
                }
                
                // Chance to have conversation (context-aware)
                if (Math.random() < 0.3) {
                    const shopConfig = CONFIG.SHOP_TYPES[currentShop.type];
                    let phrases = CONFIG.CONVERSATION_PHRASES.shopping;
                    if (shopConfig && shopConfig.category === 'food') {
                        phrases = CONFIG.CONVERSATION_PHRASES.food;
                    }
                    customer.conversation = phrases[Math.floor(Math.random() * phrases.length)];
                    customer.conversationTimer = 0;
                    customer.conversationDuration = 2000 + Math.random() * 1000;
                }
                
                // Check if this is a food shop - customer needs to dispose of trash
                const shopConfig = CONFIG.SHOP_TYPES[currentShop.type];
                if (shopConfig && shopConfig.category === 'food') {
                    // Try to find an empty trash bin nearby (within 5 tiles)
                    let foundEmptyBin = false;
                    for (const trashBin of gameState.decorations.filter(d => d.type === 'decoration-trashbin')) {
                        const dx = Math.abs(trashBin.x - currentShop.x);
                        const dy = Math.abs(trashBin.y - currentShop.y);
                        if (dx <= 5 && dy <= 5 && trashBin.trashLevel < trashBin.maxCapacity) {
                            // Customer uses this trash bin (trash added immediately)
                            trashBin.trashLevel++;
                            foundEmptyBin = true;
                            break;
                        }
                    }
                    
                    // If no empty trash bin found, 5% chance to create a spill
                    if (!foundEmptyBin && Math.random() < 0.05) {
                        const delay = 2000 + Math.random() * 3000;
                        scheduleSpillSpawn(currentShop.x, currentShop.y, delay);
                    }
                }
                
                customer.currentShopIndex++;
                
                if (customer.currentShopIndex >= customer.shoppingList.length) {
                    // Done with all shops - check if they want to wander (based on decorations)
                    const decorationBoost = gameState.decorations.reduce((sum, d) => sum + (d.reviewBoost || 0), 0);
                    const wanderChance = CONFIG.WANDER_AFTER_SHOPPING_CHANCE; // 30% chance to wander
                    
                    if (Math.random() < wanderChance) {
                        // Customer wants to wander - find a random floor tile
                        const floorTiles = [];
                        for (const [key, tile] of gameState.grid.entries()) {
                            if (tile.type === 'floor' && tile.floor === customer.floor) {
                                const [x, y] = key.split(',').map(Number);
                                const dist = Math.sqrt((x - customer.x) ** 2 + (y - customer.y) ** 2);
                                if (dist > 2 && dist < 10) {
                                    floorTiles.push({ x, y });
                                }
                            }
                        }
                        
                        if (floorTiles.length > 0) {
                            const wanderTarget = floorTiles[Math.floor(Math.random() * floorTiles.length)];
                            const gridX = Math.floor(customer.x);
                            const gridY = Math.floor(customer.y);
                            const path = findPath({ x: gridX, y: gridY }, wanderTarget) || [];
                            
                            if (path.length > 0) {
                                customer.path = path.map((p, idx) => {
                                    const offsetX = 0.2 + Math.random() * 0.6;
                                    const offsetY = 0.2 + Math.random() * 0.6;
                                    return { 
                                        x: p.x + offsetX,
                                        y: p.y + offsetY
                                    };
                                });
                                customer.pathIndex = 0;
                                customer.state = 'wandering';
                                customer.wanderTimer = 0;
                                customer.wanderTime = CONFIG.WANDER_TIME_MIN + Math.random() * (CONFIG.WANDER_TIME_MAX - CONFIG.WANDER_TIME_MIN);
                                customer.thought = 'Just looking around...';
                                if (customer.path.length > 0) {
                                    customer.targetX = customer.path[0].x;
                                    customer.targetY = customer.path[0].y;
                                }
                                continue;
                            }
                        }
                    }
                    
                    // If not wandering, leave
                    customer.state = 'leaving';
                    const entrance = gameState.entrances[0];
                    const gridX = Math.floor(customer.x);
                    const gridY = Math.floor(customer.y);
                    const path = findPath({ x: gridX, y: gridY }, entrance) || [];
                    
                    if (path.length > 0) {
                        customer.path = path.map((p, idx) => {
                            const offsetX = 0.2 + Math.random() * 0.6;
                            const offsetY = 0.2 + Math.random() * 0.6;
                            return { 
                                x: p.x + offsetX,
                                y: p.y + offsetY
                            };
                        });
                        customer.pathIndex = 0;
                        if (customer.path.length > 0) {
                            customer.targetX = customer.path[0].x;
                            customer.targetY = customer.path[0].y;
                        }
                    } else {
                        // No path found, remove customer
                        gameState.customers.splice(i, 1);
                        continue;
                    }
                } else {
                    // Go to next shop
                    const nextShop = customer.shoppingList[customer.currentShopIndex];
                    const gridX = Math.floor(customer.x);
                    const gridY = Math.floor(customer.y);
                    const path = findPath({ x: gridX, y: gridY }, { x: nextShop.x, y: nextShop.y }) || [];
                    
                    if (path.length > 0) {
                        customer.path = path.map((p, idx) => {
                            const offsetX = 0.2 + Math.random() * 0.6;
                            const offsetY = 0.2 + Math.random() * 0.6;
                            return { 
                                x: p.x + offsetX,
                                y: p.y + offsetY
                            };
                        });
                        customer.pathIndex = 0;
                        customer.state = 'walking';
                        if (customer.path.length > 0) {
                            customer.targetX = customer.path[0].x;
                            customer.targetY = customer.path[0].y;
                        }
                    } else {
                        // Can't reach next shop, leave
                        customer.state = 'leaving';
                        const entrance = gameState.entrances[0];
                        const path = findPath({ x: gridX, y: gridY }, entrance) || [];
                        if (path.length > 0) {
                            customer.path = path.map((p, idx) => {
                                const offsetX = 0.2 + Math.random() * 0.6;
                                const offsetY = 0.2 + Math.random() * 0.6;
                                return { 
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                };
                            });
                            customer.pathIndex = 0;
                            if (customer.path.length > 0) {
                                customer.targetX = customer.path[0].x;
                                customer.targetY = customer.path[0].y;
                            }
                        } else {
                            gameState.customers.splice(i, 1);
                            continue;
                        }
                    }
                }
            }
        } else if (customer.state === 'leaving') {
            // Chance to have leaving conversation
            if (!customer.conversation && Math.random() < 0.1) {
                const phrases = CONFIG.CONVERSATION_PHRASES.leaving;
                customer.conversation = phrases[Math.floor(Math.random() * phrases.length)];
                customer.conversationTimer = 0;
                customer.conversationDuration = 2000 + Math.random() * 1000;
            }
            
            const dx = customer.targetX - customer.x;
            const dy = customer.targetY - customer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                customer.pathIndex++;
                
                if (customer.pathIndex >= customer.path.length) {
                    // Left the mall - give loyalty card if first visit
                    if (!customer.loyaltyCard && customer.visitCount === 0) {
                        gameState.loyaltyCardHolders.set(customer.name, 1);
                    }
                    gameState.customers.splice(i, 1);
                    continue;
                } else {
                    customer.targetX = customer.path[customer.pathIndex].x;
                    customer.targetY = customer.path[customer.pathIndex].y;
                }
            } else {
                const speed = customer.speed * deltaSeconds;
                let moveX = (dx / distance) * speed;
                let moveY = (dy / distance) * speed;
                
                // Apply collision avoidance
                const avoidance = avoidCollisions(customer, deltaSeconds);
                moveX += avoidance.x * deltaSeconds;
                moveY += avoidance.y * deltaSeconds;
                
                customer.x += moveX;
                customer.y += moveY;
            }
        }
    }
}

// Review System
function updateReview() {
    let review = 2.0; // Base review
    
    // Shop variety bonus
    const uniqueCategories = new Set(gameState.shops.map(s => {
        const shopType = CONFIG.SHOP_TYPES[s.type];
        return shopType ? shopType.category : 'unknown';
    }));
    review += uniqueCategories.size * 0.2;
    
    // Decoration bonus
    let decorationBonus = 0;
    gameState.decorations.forEach(dec => {
        decorationBonus += dec.reviewBoost;
    });
    review += decorationBonus;
    
    // Elevator bonus (better reviews)
    const elevators = gameState.utilities.filter(u => u.type === 'elevator');
    review += elevators.length * CONFIG.ELEVATOR_REVIEW_BOOST;
    
    // Cleanliness penalty (spills reduce review)
    const spillPenalty = gameState.spills.length * 0.3;
    review -= spillPenalty;
    
    // Shop count bonus
    review += Math.min(gameState.shops.length * 0.1, 1.0);
    
    // Clamp between 0 and 5
    gameState.review = Math.max(0, Math.min(5, review));
}

// Spill System
function spawnSpillAtShop(shopX, shopY) {
    // Check if there's a trash bin nearby (within 3 tiles) - reduces spawn chance
    let hasTrashBin = false;
    for (const trashBin of gameState.decorations.filter(d => d.type === 'decoration-trashbin')) {
        const dx = Math.abs(trashBin.x - shopX);
        const dy = Math.abs(trashBin.y - shopY);
        if (dx <= 3 && dy <= 3) {
            hasTrashBin = true;
            // Trash bin reduces spill spawn chance
            if (Math.random() < trashBin.spillReduction) {
                return; // Don't spawn spill due to trash bin
            }
            break;
        }
    }
    
    // Spawn spill near the food shop (within 2 tiles)
    const nearbyTiles = [];
    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
            const key = getGridKey(shopX + dx, shopY + dy);
            const tile = gameState.grid.get(key);
            if (tile && (tile.type === 'floor' || tile.type === 'shop')) {
                // Check if there's already a spill here
                const hasSpill = gameState.spills.some(s => s.x === shopX + dx && s.y === shopY + dy);
                // Don't spawn on trash bin
                const hasTrashBinHere = gameState.decorations.some(d => 
                    d.type === 'decoration-trashbin' && d.x === shopX + dx && d.y === shopY + dy
                );
                if (!hasSpill && !hasTrashBinHere) {
                    nearbyTiles.push({ x: shopX + dx, y: shopY + dy });
                }
            }
        }
    }
    
    if (nearbyTiles.length === 0) return;
    
    const tile = nearbyTiles[Math.floor(Math.random() * nearbyTiles.length)];
    const spill = {
        id: Date.now() + Math.random(),
        x: tile.x,
        y: tile.y,
        clicks: 0,
        beingCleaned: false
    };
    
    gameState.spills.push(spill);
    updateReview();
}

function scheduleSpillSpawn(shopX, shopY, delayMs) {
    // Schedule a spill to spawn after delay
    setTimeout(() => {
        spawnSpillAtShop(shopX, shopY);
    }, delayMs);
}

function cleanSpill(spillId, isJanitor = false) {
    const spill = gameState.spills.find(s => s.id === spillId);
    if (!spill) return false;
    
    if (isJanitor) {
        // Janitor cleaning - handled in updateJanitors
        return true;
    } else {
        // Manual cleaning
        spill.clicks++;
        if (spill.clicks >= CONFIG.SPILL_CLEAN_CLICKS) {
            gameState.spills = gameState.spills.filter(s => s.id !== spillId);
            updateReview();
            return true;
        }
    }
    return false;
}

// Calculate break room quality (0-1, based on items)
function getBreakRoomQuality(breakRoom) {
    if (!breakRoom.items || breakRoom.items.length === 0) return 0;
    let totalQuality = 0;
    for (const item of breakRoom.items) {
        totalQuality += item.qualityBoost || 0;
    }
    return Math.min(1.0, totalQuality); // Cap at 1.0 (100%)
}

// Get performance multiplier for janitor based on break room quality
function getJanitorPerformanceMultiplier(janitor) {
    if (!janitor.breakRoomBoost) return 1.0;
    // Quality boost: 1.0 + (quality * 0.5), so max 1.5x speed
    return 1.0 + (janitor.breakRoomBoost * 0.5);
}

// Calculate kitchen quality (0-1, based on items)
function getKitchenQuality(kitchen) {
    if (!kitchen.items || kitchen.items.length === 0) return 0;
    let totalQuality = 0;
    for (const item of kitchen.items) {
        totalQuality += item.qualityBoost || 0;
    }
    return Math.min(1.0, totalQuality); // Cap at 1.0 (100%)
}

// Check if kitchen has a stove (required for cooking)
function kitchenHasStove(kitchen) {
    if (!kitchen.items) return false;
    return kitchen.items.some(item => item.type === 'kitchen-stove');
}

// Janitor AI
function updateJanitors(deltaTime) {
    for (const janitor of gameState.janitors) {
        if (janitor.state === 'idle') {
            // Find nearest spill or full trash bin
            let nearestTarget = null;
            let nearestDist = Infinity;
            let targetType = null; // 'spill' or 'trashbin'
            
            // Priority 1: Check for spills (highest priority)
            for (const spill of gameState.spills) {
                if (spill.beingCleaned) continue;
                
                // Check floor assignment
                if (janitor.assignedFloor !== null) {
                    const spillTile = gameState.grid.get(getGridKey(spill.x, spill.y));
                    if (!spillTile || spillTile.floor !== janitor.assignedFloor) continue;
                }
                
                const dx = spill.x - janitor.x;
                const dy = spill.y - janitor.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestTarget = spill;
                    targetType = 'spill';
                }
            }
            
            // Priority 2: Check for full trash bins (high priority)
            for (const trashBin of gameState.decorations.filter(d => d.type === 'decoration-trashbin')) {
                if (trashBin.trashLevel >= trashBin.maxCapacity && !trashBin.beingEmptied) {
                    // Check floor assignment
                    if (janitor.assignedFloor !== null && trashBin.floor !== janitor.assignedFloor) continue;
                    
                    const dx = trashBin.x - janitor.x;
                    const dy = trashBin.y - janitor.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestTarget = trashBin;
                        targetType = 'trashbin';
                    }
                }
            }
            
            // Priority 3: Check for trash bins with any trash (lower priority, but still empty them)
            // Only if no spills or full trash bins found
            if (targetType === null) {
                for (const trashBin of gameState.decorations.filter(d => d.type === 'decoration-trashbin')) {
                    if (trashBin.trashLevel > 0 && !trashBin.beingEmptied) {
                        // Check floor assignment
                        if (janitor.assignedFloor !== null && trashBin.floor !== janitor.assignedFloor) continue;
                        
                        const dx = trashBin.x - janitor.x;
                        const dy = trashBin.y - janitor.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestTarget = trashBin;
                            targetType = 'trashbin';
                        }
                    }
                }
            }
            
            // Priority 4: If no work and break cooldown passed, go to break room
            if (targetType === null && (!janitor.lastBreakTime || Date.now() - janitor.lastBreakTime > CONFIG.JANITOR_BREAK_COOLDOWN)) {
                if (Math.random() < CONFIG.JANITOR_BREAK_CHANCE && gameState.breakRooms.length > 0) {
                    // Find nearest break room
                    let nearestBreakRoom = null;
                    let nearestBreakDist = Infinity;
                    
                    for (const breakRoom of gameState.breakRooms) {
                        const dx = breakRoom.x - janitor.x;
                        const dy = breakRoom.y - janitor.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < nearestBreakDist) {
                            nearestBreakDist = dist;
                            nearestBreakRoom = breakRoom;
                        }
                    }
                    
                    if (nearestBreakRoom) {
                        janitor.targetBreakRoom = nearestBreakRoom.id;
                        janitor.state = 'going-to-breakroom';
                        
                        const gridX = Math.floor(janitor.x);
                        const gridY = Math.floor(janitor.y);
                        // Path to center of break room (4x3, so center is at x+2, y+1.5)
                        const breakRoomCenterX = nearestBreakRoom.x + 2;
                        const breakRoomCenterY = nearestBreakRoom.y + 1;
                        const path = findPath({ x: gridX, y: gridY }, { x: breakRoomCenterX, y: breakRoomCenterY }) || [];
                        
                        if (path.length > 0) {
                            janitor.path = path.map((p, idx) => {
                                const offsetX = 0.2 + Math.random() * 0.6;
                                const offsetY = 0.2 + Math.random() * 0.6;
                                return { 
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                };
                            });
                            janitor.pathIndex = 0;
                            if (janitor.path.length > 0) {
                                janitor.targetX = janitor.path[0].x;
                                janitor.targetY = janitor.path[0].y;
                            }
                        }
                        continue;
                    }
                }
            }
            
            if (nearestTarget) {
                janitor.targetType = targetType;
                if (targetType === 'spill') {
                    janitor.targetSpill = nearestTarget;
                    nearestTarget.beingCleaned = true;
                } else if (targetType === 'trashbin') {
                    janitor.targetTrashBin = nearestTarget;
                    nearestTarget.beingEmptied = true;
                }
                
                // Find path to target
                const gridX = Math.floor(janitor.x);
                const gridY = Math.floor(janitor.y);
                const path = findPath({ x: gridX, y: gridY }, { x: nearestTarget.x, y: nearestTarget.y }) || [];
                
                if (path.length > 0) {
                    janitor.path = path.map((p, idx) => {
                        const offsetX = 0.2 + Math.random() * 0.6;
                        const offsetY = 0.2 + Math.random() * 0.6;
                        return { 
                            x: p.x + offsetX,
                            y: p.y + offsetY
                        };
                    });
                    janitor.pathIndex = 0;
                    janitor.state = 'moving';
                    if (janitor.path.length > 0) {
                        janitor.targetX = janitor.path[0].x;
                        janitor.targetY = janitor.path[0].y;
                    }
                }
            }
        } else if (janitor.state === 'moving') {
            // Check if boost expired (30 seconds)
            if (janitor.breakRoomBoost > 0 && janitor.breakRoomBoostStartTime) {
                const boostAge = Date.now() - janitor.breakRoomBoostStartTime;
                if (boostAge > 30000) { // 30 seconds
                    janitor.breakRoomBoost = 0;
                    janitor.breakRoomBoostStartTime = 0;
                }
            }
            
            const dx = janitor.targetX - janitor.x;
            const dy = janitor.targetY - janitor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                janitor.pathIndex++;
                
                if (janitor.pathIndex >= janitor.path.length) {
                    // Reached target
                    janitor.state = janitor.targetType === 'trashbin' ? 'emptying' : 'cleaning';
                    janitor.cleaningProgress = 0;
                } else {
                    janitor.targetX = janitor.path[janitor.pathIndex].x;
                    janitor.targetY = janitor.path[janitor.pathIndex].y;
                }
            } else {
                const baseSpeed = 0.5 * (deltaTime / 1000); // Slower than customers
                const speedMultiplier = getJanitorPerformanceMultiplier(janitor); // Apply boost to movement speed
                const speed = baseSpeed * speedMultiplier;
                janitor.x += (dx / distance) * speed;
                janitor.y += (dy / distance) * speed;
            }
        } else if (janitor.state === 'going-to-breakroom') {
            // Check if boost expired (30 seconds)
            if (janitor.breakRoomBoost > 0 && janitor.breakRoomBoostStartTime) {
                const boostAge = Date.now() - janitor.breakRoomBoostStartTime;
                if (boostAge > 30000) { // 30 seconds
                    janitor.breakRoomBoost = 0;
                    janitor.breakRoomBoostStartTime = 0;
                }
            }
            
            const dx = janitor.targetX - janitor.x;
            const dy = janitor.targetY - janitor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                janitor.pathIndex++;
                
                if (janitor.pathIndex >= janitor.path.length) {
                    // Reached break room - find an item to interact with
                    const breakRoom = gameState.breakRooms.find(br => br.id === janitor.targetBreakRoom);
                    if (breakRoom && breakRoom.items && breakRoom.items.length > 0) {
                        // Find an available item (not being used by another janitor)
                        const availableItems = breakRoom.items.filter(item => {
                            // Check if another janitor is using this item
                            return !gameState.janitors.some(j => 
                                j.id !== janitor.id && 
                                j.targetBreakRoomItem && 
                                j.targetBreakRoomItem.id === item.id
                            );
                        });
                        
                        if (availableItems.length > 0) {
                            // Pick a random available item
                            const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                            janitor.targetBreakRoomItem = selectedItem;
                            janitor.state = 'going-to-breakroom-item';
                            
                            // Path to the item
                            const gridX = Math.floor(janitor.x);
                            const gridY = Math.floor(janitor.y);
                            const path = findPath({ x: gridX, y: gridY }, { x: selectedItem.x, y: selectedItem.y }) || [];
                            
                            if (path.length > 0) {
                                janitor.path = path.map((p, idx) => {
                                    const offsetX = 0.2 + Math.random() * 0.6;
                                    const offsetY = 0.2 + Math.random() * 0.6;
                                    return { 
                                        x: p.x + offsetX,
                                        y: p.y + offsetY
                                    };
                                });
                                janitor.pathIndex = 0;
                                if (janitor.path.length > 0) {
                                    janitor.targetX = janitor.path[0].x;
                                    janitor.targetY = janitor.path[0].y;
                                }
                            } else {
                                // Can't path to item, just rest at center
                                janitor.state = 'resting';
                                janitor.restTimer = 0;
                                janitor.restTime = CONFIG.JANITOR_BREAK_TIME;
                                janitor.x = breakRoom.x + 2;
                                janitor.y = breakRoom.y + 1.5;
                            }
                        } else {
                            // No available items, rest at center
                            janitor.state = 'resting';
                            janitor.restTimer = 0;
                            janitor.restTime = CONFIG.JANITOR_BREAK_TIME;
                            janitor.x = breakRoom.x + 2;
                            janitor.y = breakRoom.y + 1.5;
                        }
                    } else {
                        // No items in break room, rest at center
                        if (breakRoom) {
                            janitor.state = 'resting';
                            janitor.restTimer = 0;
                            janitor.restTime = CONFIG.JANITOR_BREAK_TIME;
                            janitor.x = breakRoom.x + 2;
                            janitor.y = breakRoom.y + 1.5;
                        } else {
                            janitor.state = 'idle';
                            janitor.targetBreakRoom = null;
                        }
                    }
                } else {
                    janitor.targetX = janitor.path[janitor.pathIndex].x;
                    janitor.targetY = janitor.path[janitor.pathIndex].y;
                }
            } else {
                const baseSpeed = 0.5 * (deltaTime / 1000);
                const speedMultiplier = getJanitorPerformanceMultiplier(janitor); // Apply boost to movement speed
                const speed = baseSpeed * speedMultiplier;
                janitor.x += (dx / distance) * speed;
                janitor.y += (dy / distance) * speed;
            }
        } else if (janitor.state === 'going-to-breakroom-item') {
            // Check if boost expired (30 seconds)
            if (janitor.breakRoomBoost > 0 && janitor.breakRoomBoostStartTime) {
                const boostAge = Date.now() - janitor.breakRoomBoostStartTime;
                if (boostAge > 30000) { // 30 seconds
                    janitor.breakRoomBoost = 0;
                    janitor.breakRoomBoostStartTime = 0;
                }
            }
            
            const dx = janitor.targetX - janitor.x;
            const dy = janitor.targetY - janitor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                janitor.pathIndex++;
                
                if (janitor.pathIndex >= janitor.path.length) {
                    // Reached break room item - start resting/interacting
                    if (janitor.targetBreakRoomItem) {
                        janitor.state = 'resting';
                        janitor.restTimer = 0;
                        janitor.restTime = CONFIG.JANITOR_BREAK_TIME;
                        // Position at the item location
                        janitor.x = janitor.targetBreakRoomItem.x + 0.5;
                        janitor.y = janitor.targetBreakRoomItem.y + 0.5;
                    } else {
                        janitor.state = 'idle';
                        janitor.targetBreakRoom = null;
                        janitor.targetBreakRoomItem = null;
                    }
                } else {
                    janitor.targetX = janitor.path[janitor.pathIndex].x;
                    janitor.targetY = janitor.path[janitor.pathIndex].y;
                }
            } else {
                const baseSpeed = 0.5 * (deltaTime / 1000);
                const speedMultiplier = getJanitorPerformanceMultiplier(janitor); // Apply boost to movement speed
                const speed = baseSpeed * speedMultiplier;
                janitor.x += (dx / distance) * speed;
                janitor.y += (dy / distance) * speed;
            }
        } else if (janitor.state === 'resting') {
            // Check if boost expired (30 seconds)
            if (janitor.breakRoomBoost > 0 && janitor.breakRoomBoostStartTime) {
                const boostAge = Date.now() - janitor.breakRoomBoostStartTime;
                if (boostAge > 30000) { // 30 seconds
                    janitor.breakRoomBoost = 0;
                    janitor.breakRoomBoostStartTime = 0;
                }
            }
            
            janitor.restTimer = (janitor.restTimer || 0) + deltaTime;
            
                if (janitor.restTimer >= janitor.restTime) {
                // Done resting - apply boost based on break room quality
                const breakRoom = gameState.breakRooms.find(br => br.id === janitor.targetBreakRoom);
                if (breakRoom) {
                    const quality = getBreakRoomQuality(breakRoom);
                    janitor.breakRoomBoost = quality; // Set boost
                    janitor.breakRoomBoostStartTime = Date.now(); // Track when boost started
                }
                janitor.lastBreakTime = Date.now();
                janitor.targetBreakRoom = null;
                janitor.targetBreakRoomItem = null;
                janitor.restTimer = 0;
                janitor.state = 'idle';
            }
        } else if (janitor.state === 'cleaning') {
            // Check if boost expired (30 seconds)
            if (janitor.breakRoomBoost > 0 && janitor.breakRoomBoostStartTime) {
                const boostAge = Date.now() - janitor.breakRoomBoostStartTime;
                if (boostAge > 30000) { // 30 seconds
                    janitor.breakRoomBoost = 0;
                    janitor.breakRoomBoostStartTime = 0;
                }
            }
            
            const performanceMultiplier = getJanitorPerformanceMultiplier(janitor);
            janitor.cleaningProgress = (janitor.cleaningProgress || 0) + (deltaTime * performanceMultiplier);
            
                if (janitor.cleaningProgress >= CONFIG.JANITOR_CLEAN_TIME) {
                    // Done cleaning spill
                    if (janitor.targetSpill) {
                        gameState.spills = gameState.spills.filter(s => s.id !== janitor.targetSpill.id);
                        updateReview();
                        janitor.targetSpill.beingCleaned = false;
                        janitor.targetSpill = null;
                        janitor.tasksCompleted = (janitor.tasksCompleted || 0) + 1;
                    }
                    janitor.targetType = null;
                    janitor.cleaningProgress = 0;
                    janitor.state = 'idle';
                }
        } else if (janitor.state === 'emptying') {
            // Check if boost expired (30 seconds)
            if (janitor.breakRoomBoost > 0 && janitor.breakRoomBoostStartTime) {
                const boostAge = Date.now() - janitor.breakRoomBoostStartTime;
                if (boostAge > 30000) { // 30 seconds
                    janitor.breakRoomBoost = 0;
                    janitor.breakRoomBoostStartTime = 0;
                }
            }
            
            const performanceMultiplier = getJanitorPerformanceMultiplier(janitor);
            janitor.cleaningProgress = (janitor.cleaningProgress || 0) + (deltaTime * performanceMultiplier);
            
                if (janitor.cleaningProgress >= CONFIG.JANITOR_CLEAN_TIME) {
                    // Done emptying trash bin
                    if (janitor.targetTrashBin) {
                        janitor.targetTrashBin.trashLevel = 0;
                        janitor.targetTrashBin.beingEmptied = false;
                        janitor.targetTrashBin = null;
                        janitor.tasksCompleted = (janitor.tasksCompleted || 0) + 1;
                    }
                    janitor.targetType = null;
                    janitor.cleaningProgress = 0;
                    janitor.state = 'idle';
                }
        }
    }
}

// Chef AI
function updateChefs(deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    for (const chef of gameState.chefs) {
        if (chef.state === 'idle') {
            // Check if cooldown has passed
            const canCook = !chef.lastCookTime || (Date.now() - chef.lastCookTime) >= CONFIG.CHEF_COOK_COOLDOWN;
            
            // If on cooldown, go to kitchen/break room to rest
            if (!canCook) {
                // Check if chef is already in a kitchen or break room
                const isInKitchen = gameState.kitchens.some(k => {
                    const dx = chef.x - (k.x + 1.5);
                    const dy = chef.y - (k.y + 2);
                    return Math.abs(dx) < 1.5 && Math.abs(dy) < 2;
                });
                const isInBreakRoom = gameState.breakRooms.some(br => {
                    const dx = chef.x - (br.x + 2);
                    const dy = chef.y - (br.y + 1.5);
                    return Math.abs(dx) < 2 && Math.abs(dy) < 1.5;
                });
                
                if (!isInKitchen && !isInBreakRoom) {
                    // Find nearest kitchen or break room
                    let nearestRest = null;
                    let nearestDist = Infinity;
                    let restType = null; // 'kitchen' or 'breakroom'
                    
                    // Check kitchens first
                    for (const kitchen of gameState.kitchens) {
                        const dx = kitchen.x + 1.5 - chef.x;
                        const dy = kitchen.y + 2 - chef.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestRest = kitchen;
                            restType = 'kitchen';
                        }
                    }
                    
                    // Check break rooms
                    for (const breakRoom of gameState.breakRooms) {
                        const dx = breakRoom.x + 2 - chef.x;
                        const dy = breakRoom.y + 1.5 - chef.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestRest = breakRoom;
                            restType = 'breakroom';
                        }
                    }
                    
                    if (nearestRest) {
                        chef.targetRest = nearestRest;
                        chef.restType = restType;
                        chef.state = 'going-to-rest';
                        
                        const gridX = Math.floor(chef.x);
                        const gridY = Math.floor(chef.y);
                        let targetX, targetY;
                        
                        if (restType === 'kitchen') {
                            targetX = nearestRest.x + 1;
                            targetY = nearestRest.y + 2;
                        } else {
                            targetX = nearestRest.x + 2;
                            targetY = nearestRest.y + 1;
                        }
                        
                        const path = findPath({ x: gridX, y: gridY }, { x: targetX, y: targetY }) || [];
                        
                        if (path.length > 0) {
                            chef.path = path.map((p, idx) => {
                                const offsetX = 0.2 + Math.random() * 0.6;
                                const offsetY = 0.2 + Math.random() * 0.6;
                                return { 
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                };
                            });
                            chef.pathIndex = 0;
                            if (chef.path.length > 0) {
                                chef.targetX = chef.path[0].x;
                                chef.targetY = chef.path[0].y;
                            }
                        }
                    }
                }
            } else if (canCook) {
                // Find nearest kitchen with a stove
                let nearestKitchen = null;
                let nearestDist = Infinity;
                
                for (const kitchen of gameState.kitchens) {
                    if (!kitchenHasStove(kitchen)) continue; // Must have stove
                    
                    // Check if another chef is using this kitchen
                    const isKitchenInUse = gameState.chefs.some(c => 
                        c.id !== chef.id && 
                        c.targetKitchen && 
                        c.targetKitchen.id === kitchen.id &&
                        (c.state === 'cooking' || c.state === 'going-to-kitchen')
                    );
                    
                    if (isKitchenInUse) continue; // Kitchen is busy
                    
                    const dx = kitchen.x - chef.x;
                    const dy = kitchen.y - chef.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestKitchen = kitchen;
                    }
                }
                
                if (nearestKitchen) {
                    chef.targetKitchen = nearestKitchen;
                    chef.state = 'going-to-kitchen';
                    
                    const gridX = Math.floor(chef.x);
                    const gridY = Math.floor(chef.y);
                    // Path to center of kitchen (3x4, so center is at x+1.5, y+2)
                    const kitchenCenterX = nearestKitchen.x + 1;
                    const kitchenCenterY = nearestKitchen.y + 2;
                    const path = findPath({ x: gridX, y: gridY }, { x: kitchenCenterX, y: kitchenCenterY }) || [];
                    
                    if (path.length > 0) {
                        chef.path = path.map((p, idx) => {
                            const offsetX = 0.2 + Math.random() * 0.6;
                            const offsetY = 0.2 + Math.random() * 0.6;
                            return { 
                                x: p.x + offsetX,
                                y: p.y + offsetY
                            };
                        });
                        chef.pathIndex = 0;
                        if (chef.path.length > 0) {
                            chef.targetX = chef.path[0].x;
                            chef.targetY = chef.path[0].y;
                        }
                    }
                }
            }
        } else if (chef.state === 'going-to-rest') {
            const dx = chef.targetX - chef.x;
            const dy = chef.targetY - chef.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                chef.pathIndex++;
                
                if (chef.pathIndex >= chef.path.length) {
                    // Reached rest area - stay there
                    if (chef.restType === 'kitchen') {
                        chef.x = chef.targetRest.x + 1.5;
                        chef.y = chef.targetRest.y + 2;
                    } else {
                        chef.x = chef.targetRest.x + 2;
                        chef.y = chef.targetRest.y + 1.5;
                    }
                    chef.state = 'resting';
                } else {
                    chef.targetX = chef.path[chef.pathIndex].x;
                    chef.targetY = chef.path[chef.pathIndex].y;
                }
            } else {
                const speed = 0.6 * deltaSeconds;
                chef.x += (dx / distance) * speed;
                chef.y += (dy / distance) * speed;
            }
        } else if (chef.state === 'resting') {
            // Stay in rest area until cooldown passes
            const canCook = !chef.lastCookTime || (Date.now() - chef.lastCookTime) >= CONFIG.CHEF_COOK_COOLDOWN;
            if (canCook) {
                chef.state = 'idle';
                chef.targetRest = null;
            }
        } else if (chef.state === 'going-to-kitchen') {
            const dx = chef.targetX - chef.x;
            const dy = chef.targetY - chef.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                chef.pathIndex++;
                
                if (chef.pathIndex >= chef.path.length) {
                    // Reached kitchen - start cooking
                    if (chef.targetKitchen && kitchenHasStove(chef.targetKitchen)) {
                        chef.state = 'cooking';
                        chef.cookingProgress = 0;
                        chef.x = chef.targetKitchen.x + 1.5;
                        chef.y = chef.targetKitchen.y + 2;
                    } else {
                        chef.state = 'idle';
                        chef.targetKitchen = null;
                    }
                } else {
                    chef.targetX = chef.path[chef.pathIndex].x;
                    chef.targetY = chef.path[chef.pathIndex].y;
                }
            } else {
                const speed = 0.6 * deltaSeconds; // Chef speed
                chef.x += (dx / distance) * speed;
                chef.y += (dy / distance) * speed;
            }
        } else if (chef.state === 'cooking') {
            chef.cookingProgress += deltaTime;
            
            if (chef.cookingProgress >= CONFIG.CHEF_COOK_TIME) {
                // Done cooking - find nearest customer
                chef.hasFood = true;
                chef.lastCookTime = Date.now();
                
                // Find nearest customer
                let nearestCustomer = null;
                let nearestDist = Infinity;
                
                for (const customer of gameState.customers) {
                    if (customer.state === 'leaving' || customer.injured) continue;
                    
                    const dx = customer.x - chef.x;
                    const dy = customer.y - chef.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestCustomer = customer;
                    }
                }
                
                if (nearestCustomer) {
                    chef.targetCustomer = nearestCustomer.id;
                    chef.state = 'going-to-customer';
                    
                    const gridX = Math.floor(chef.x);
                    const gridY = Math.floor(chef.y);
                    const path = findPath({ x: gridX, y: gridY }, { x: Math.floor(nearestCustomer.x), y: Math.floor(nearestCustomer.y) }) || [];
                    
                    if (path.length > 0) {
                        chef.path = path.map((p, idx) => {
                            const offsetX = 0.2 + Math.random() * 0.6;
                            const offsetY = 0.2 + Math.random() * 0.6;
                            return { 
                                x: p.x + offsetX,
                                y: p.y + offsetY
                            };
                        });
                        chef.pathIndex = 0;
                        if (chef.path.length > 0) {
                            chef.targetX = chef.path[0].x;
                            chef.targetY = chef.path[0].y;
                        }
                    }
                } else {
                    // No customers found, go back to idle
                    chef.hasFood = false;
                    chef.targetKitchen = null;
                    chef.state = 'idle';
                }
            }
        } else if (chef.state === 'going-to-customer') {
            const dx = chef.targetX - chef.x;
            const dy = chef.targetY - chef.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                chef.pathIndex++;
                
                if (chef.pathIndex >= chef.path.length) {
                    // Reached customer - deliver food
                    const customer = gameState.customers.find(c => c.id === chef.targetCustomer);
                    if (customer && chef.hasFood) {
                        // Calculate payment based on kitchen quality
                        const kitchen = chef.targetKitchen;
                        if (kitchen) {
                            const quality = getKitchenQuality(kitchen);
                            const payment = CONFIG.CHEF_BASE_PAYMENT + (quality * CONFIG.CHEF_PAYMENT_MULTIPLIER * 100); // $20 + up to $50
                            
                            gameState.money += payment;
                            gameState.dailyIncome += payment;
                            
                            // Customer receives food
                            customer.thought = `Got food! Paid $${payment.toFixed(0)}`;
                            customer.conversation = 'Yummy!';
                            customer.conversationTimer = 0;
                            customer.conversationDuration = 2000 + Math.random() * 1000;
                            
                            // Track performance
                            chef.mealsCooked = (chef.mealsCooked || 0) + 1;
                        }
                        
                        chef.hasFood = false;
                        chef.targetKitchen = null;
                        chef.targetCustomer = null;
                        chef.state = 'idle';
                    } else {
                        // Customer left or food lost
                        chef.hasFood = false;
                        chef.targetKitchen = null;
                        chef.targetCustomer = null;
                        chef.state = 'idle';
                    }
                } else {
                    chef.targetX = chef.path[chef.pathIndex].x;
                    chef.targetY = chef.path[chef.pathIndex].y;
                }
            } else {
                const speed = 0.6 * deltaSeconds; // Chef speed
                chef.x += (dx / distance) * speed;
                chef.y += (dy / distance) * speed;
            }
        }
    }
}

// Hospital Staff AI
function updateHospitalStaff(deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    // Find injured customers
    const injuredCustomers = gameState.customers.filter(c => c.injured && c.state === 'injured');
    
    // Spawn hospital staff for injured customers without staff
    for (const customer of injuredCustomers) {
        const hasStaff = gameState.hospitalStaff.some(s => s.targetCustomer === customer.id);
        if (!hasStaff) {
            // Spawn hospital staff near customer
            const staff = {
                id: Date.now() + Math.random(),
                x: customer.x + (Math.random() - 0.5) * 2,
                y: customer.y + (Math.random() - 0.5) * 2,
                floor: customer.floor,
                targetCustomer: customer.id,
                state: 'moving', // moving, escorting
                path: [],
                pathIndex: 0,
                targetX: customer.x,
                targetY: customer.y
            };
            gameState.hospitalStaff.push(staff);
        }
    }
    
    // Update hospital staff
    for (let i = gameState.hospitalStaff.length - 1; i >= 0; i--) {
        const staff = gameState.hospitalStaff[i];
        const customer = gameState.customers.find(c => c.id === staff.targetCustomer);
        
        if (!customer || !customer.injured) {
            // Customer no longer injured, remove staff
            gameState.hospitalStaff.splice(i, 1);
            continue;
        }
        
        if (staff.state === 'moving') {
            // Move towards injured customer
            const dx = customer.x - staff.x;
            const dy = customer.y - staff.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.3) {
                // Reached customer, start escorting
                staff.state = 'escorting';
            } else {
                // Move towards customer
                const speed = CONFIG.HOSPITAL_STAFF_SPEED * deltaSeconds;
                staff.x += (dx / distance) * speed;
                staff.y += (dy / distance) * speed;
            }
        } else if (staff.state === 'escorting') {
            // Move customer to nearest entrance
            const entrance = gameState.entrances[0];
            if (entrance) {
                const dx = entrance.x - customer.x;
                const dy = entrance.y - customer.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 0.5) {
                    // Reached entrance, remove customer
                    gameState.customers = gameState.customers.filter(c => c.id !== customer.id);
                    gameState.hospitalStaff.splice(i, 1);
                    continue;
                } else {
                    // Move customer towards entrance
                    const speed = CONFIG.HOSPITAL_STAFF_SPEED * deltaSeconds;
                    customer.x += (dx / distance) * speed;
                    customer.y += (dy / distance) * speed;
                    staff.x = customer.x;
                    staff.y = customer.y;
                }
            }
        }
    }
}

// Customer Bench and Trash Bin Interaction
function updateCustomerBenchInteraction(deltaTime) {
    for (const customer of gameState.customers) {
        // Check if near a bench (only when walking, not shopping or other states)
        if (customer.state === 'walking' && !customer.usingBench) {
            for (const bench of gameState.decorations.filter(d => d.isBench)) {
                const dx = bench.x - customer.x;
                const dy = bench.y - customer.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 0.8 && bench.customersUsing < 2) {
                    // Customer sits on bench
                    if (Math.random() < 0.3) { // 30% chance to use bench
                        // Find an available seat
                        let availableSeat = null;
                        for (const seat of bench.seatPositions) {
                            if (!seat.occupied) {
                                availableSeat = seat;
                                break;
                            }
                        }
                        
                        if (availableSeat) {
                            customer.usingBench = bench.id;
                            customer.benchSeat = availableSeat;
                            availableSeat.occupied = true;
                            bench.customersUsing++;
                            customer.benchTimer = 0;
                            customer.benchTime = 3000 + Math.random() * 2000;
                            customer.state = 'resting';
                            
                            // Conversation about bench
                            if (Math.random() < 0.4) {
                                const phrases = CONFIG.CONVERSATION_PHRASES.bench;
                                customer.conversation = phrases[Math.floor(Math.random() * phrases.length)];
                                customer.conversationTimer = 0;
                                customer.conversationDuration = 2000 + Math.random() * 1000;
                            }
                            
                            // Calculate seat position based on rotation
                            let seatX = availableSeat.x;
                            let seatY = availableSeat.y;
                            const rotation = (bench.rotation || 0) * Math.PI / 180;
                            
                            if (rotation !== 0) {
                                // Rotate seat position around center (0.5, 0.5)
                                const centerX = 0.5;
                                const centerY = 0.5;
                                const relX = seatX - centerX;
                                const relY = seatY - centerY;
                                const cos = Math.cos(rotation);
                                const sin = Math.sin(rotation);
                                seatX = centerX + relX * cos - relY * sin;
                                seatY = centerY + relX * sin + relY * cos;
                            }
                            
                            // Position customer at fixed seat position
                            customer.x = bench.x + seatX;
                            customer.y = bench.y + seatY;
                        }
                    }
                }
            }
            
            // Check if customer is going to a food shop and should visit trash bin (95% chance)
            if (!customer.visitingTrashBin && customer.state === 'walking' && customer.shoppingList && customer.currentShopIndex < customer.shoppingList.length) {
                const targetShop = customer.shoppingList[customer.currentShopIndex];
                const shopConfig = CONFIG.SHOP_TYPES[targetShop.type];
                
                // Only visit trash bin if going to food shop
                if (shopConfig && shopConfig.category === 'food' && Math.random() < CONFIG.TRASH_BIN_VISIT_CHANCE) {
                    // Find nearest trash bin
                    let nearestTrashBin = null;
                    let nearestDist = Infinity;
                    
                    for (const trashBin of gameState.decorations.filter(d => d.type === 'decoration-trashbin')) {
                        const dx = trashBin.x - customer.x;
                        const dy = trashBin.y - customer.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        // If within 5 tiles
                        if (dist < 5 && dist < nearestDist) {
                            nearestDist = dist;
                            nearestTrashBin = trashBin;
                        }
                    }
                    
                    if (nearestTrashBin && nearestTrashBin.trashLevel < nearestTrashBin.maxCapacity) {
                        // Only visit if trash bin is not full
                        // Add trash bin to path before going to shop
                        const gridX = Math.floor(customer.x);
                        const gridY = Math.floor(customer.y);
                        const path = findPath({ x: gridX, y: gridY }, { x: nearestTrashBin.x, y: nearestTrashBin.y }) || [];
                        
                        if (path.length > 0) {
                            customer.visitingTrashBin = nearestTrashBin.id;
                            customer.trashBinPath = path.map((p, idx) => {
                                const offsetX = 0.2 + Math.random() * 0.6;
                                const offsetY = 0.2 + Math.random() * 0.6;
                                return { 
                                    x: p.x + offsetX,
                                    y: p.y + offsetY
                                };
                            });
                            customer.trashBinPathIndex = 0;
                            customer.trashBinTargetX = customer.trashBinPath[0].x;
                            customer.trashBinTargetY = customer.trashBinPath[0].y;
                            customer.state = 'going-to-trashbin';
                            // Save original shop path
                            customer.originalPath = customer.path;
                            customer.originalPathIndex = customer.pathIndex;
                            
                            // Conversation about going to trash bin
                            if (Math.random() < 0.3) {
                                const phrases = CONFIG.CONVERSATION_PHRASES.trashbin;
                                customer.conversation = phrases[Math.floor(Math.random() * phrases.length)];
                                customer.conversationTimer = 0;
                                customer.conversationDuration = 2000 + Math.random() * 1000;
                            }
                        }
                    }
                }
            }
        }
        
        // Handle trash bin visit
        if (customer.state === 'going-to-trashbin') {
            const dx = customer.trashBinTargetX - customer.x;
            const dy = customer.trashBinTargetY - customer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                customer.trashBinPathIndex++;
                
                if (customer.trashBinPathIndex >= customer.trashBinPath.length) {
                    // Reached trash bin - check if it's still available
                    const trashBin = gameState.decorations.find(d => d.id === customer.visitingTrashBin);
                    if (!trashBin || trashBin.trashLevel >= trashBin.maxCapacity) {
                        // Trash bin is full, customer leaves and creates spill
                        customer.visitingTrashBin = null;
                        customer.state = 'walking';
                        
                        // Create spill at current location
                        const gridX = Math.floor(customer.x);
                        const gridY = Math.floor(customer.y);
                        const spill = {
                            id: Date.now() + Math.random(),
                            x: gridX,
                            y: gridY,
                            clicks: 0,
                            beingCleaned: false
                        };
                        gameState.spills.push(spill);
                        updateReview();
                        
                        // Conversation about full bin
                        if (Math.random() < 0.5) {
                            customer.conversation = CONFIG.CONVERSATION_PHRASES.trashbin[2]; // "This bin is full!"
                            customer.conversationTimer = 0;
                            customer.conversationDuration = 2000 + Math.random() * 1000;
                        }
                        
                        // Restore original path to shop
                        if (customer.originalPath && customer.originalPath.length > 0) {
                            customer.path = customer.originalPath;
                            customer.pathIndex = customer.originalPathIndex || 0;
                            if (customer.path.length > customer.pathIndex) {
                                customer.targetX = customer.path[customer.pathIndex].x;
                                customer.targetY = customer.path[customer.pathIndex].y;
                            }
                        }
                    } else {
                        // Trash bin is available - throw trash
                        customer.state = 'at-trashbin';
                        customer.trashBinTimer = 0;
                        customer.trashBinTime = 1000 + Math.random() * 500; // 1-1.5 seconds
                    }
                } else {
                    customer.trashBinTargetX = customer.trashBinPath[customer.trashBinPathIndex].x;
                    customer.trashBinTargetY = customer.trashBinPath[customer.trashBinPathIndex].y;
                }
            } else {
                const speed = customer.speed * (deltaTime / 1000);
                customer.x += (dx / distance) * speed;
                customer.y += (dy / distance) * speed;
            }
        } else if (customer.state === 'at-trashbin') {
            const trashBin = gameState.decorations.find(d => d.id === customer.visitingTrashBin);
            
            // Check if trash bin is still available (not full)
            if (!trashBin || trashBin.trashLevel >= trashBin.maxCapacity) {
                // Trash bin is full, customer leaves and creates spill
                customer.visitingTrashBin = null;
                customer.state = 'walking';
                
                // Create spill at current location
                const gridX = Math.floor(customer.x);
                const gridY = Math.floor(customer.y);
                const spill = {
                    id: Date.now() + Math.random(),
                    x: gridX,
                    y: gridY,
                    clicks: 0,
                    beingCleaned: false
                };
                gameState.spills.push(spill);
                updateReview();
                
                // Conversation about full bin
                if (Math.random() < 0.5) {
                    customer.conversation = CONFIG.CONVERSATION_PHRASES.trashbin[2]; // "This bin is full!"
                    customer.conversationTimer = 0;
                    customer.conversationDuration = 2000 + Math.random() * 1000;
                }
                
                // Restore original path to shop
                if (customer.originalPath && customer.originalPath.length > 0) {
                    customer.path = customer.originalPath;
                    customer.pathIndex = customer.originalPathIndex || 0;
                    if (customer.path.length > customer.pathIndex) {
                        customer.targetX = customer.path[customer.pathIndex].x;
                        customer.targetY = customer.path[customer.pathIndex].y;
                    }
                }
                continue;
            }
            
            customer.trashBinTimer = (customer.trashBinTimer || 0) + deltaTime;
            
            if (customer.trashBinTimer >= customer.trashBinTime) {
                // Done throwing trash - add to trash bin
                if (trashBin && trashBin.trashLevel < trashBin.maxCapacity) {
                    trashBin.trashLevel++;
                }
                
                customer.visitingTrashBin = null;
                customer.state = 'walking';
                // Restore original path to shop
                if (customer.originalPath && customer.originalPath.length > 0) {
                    customer.path = customer.originalPath;
                    customer.pathIndex = customer.originalPathIndex || 0;
                    if (customer.path.length > customer.pathIndex) {
                        customer.targetX = customer.path[customer.pathIndex].x;
                        customer.targetY = customer.path[customer.pathIndex].y;
                    }
                }
            }
        }
        
        if (customer.usingBench) {
            customer.benchTimer = (customer.benchTimer || 0) + deltaTime;
            
            if (customer.benchTimer >= customer.benchTime) {
                // Done using bench, continue shopping
                const bench = gameState.decorations.find(d => d.id === customer.usingBench);
                if (bench && customer.benchSeat) {
                    customer.benchSeat.occupied = false;
                    bench.customersUsing--;
                }
                customer.usingBench = null;
                customer.benchSeat = null;
                if (customer.state === 'resting') {
                    customer.state = 'walking';
                }
            }
        }
        
        // Update conversation timer
        if (customer.conversation) {
            customer.conversationTimer += deltaTime;
            if (customer.conversationTimer >= customer.conversationDuration) {
                customer.conversation = null;
                customer.conversationTimer = 0;
            }
        }
    }
}

// Special Events
function checkSpecialEvents() {
    const now = Date.now();
    const timeSinceLastEvent = now - gameState.lastEventTime;
    
    if (timeSinceLastEvent >= CONFIG.EVENT_INTERVAL) {
        // Trigger Rush Hour
        const event = {
            id: Date.now(),
            type: 'rush-hour',
            name: 'Rush Hour!',
            description: 'Customer spawn rate doubled!',
            startTime: now,
            duration: 60000, // 1 minute
            active: true
        };
        
        gameState.events.push(event);
        gameState.lastEventTime = now;
    }
    
    // Remove expired events
    gameState.events = gameState.events.filter(e => {
        if (e.active && (now - e.startTime) >= e.duration) {
            e.active = false;
            return false;
        }
        return true;
    });
}

function getCustomerSpawnRate() {
    let rate = CONFIG.CUSTOMER_SPAWN_RATE;
    
    // Review affects spawn rate (higher review = more customers)
    rate *= (0.5 + gameState.review);
    
    // Rush Hour multiplier
    const rushHour = gameState.events.find(e => e.type === 'rush-hour' && e.active);
    if (rushHour) {
        rate *= CONFIG.RUSH_HOUR_MULTIPLIER;
    }
    
    return rate;
}

function getCustomerLeaveRate() {
    let rate = 0.1; // Base leave rate
    
    // Lower review = higher leave rate
    rate *= (1.5 - gameState.review * 0.2);
    
    // Spills increase leave rate
    rate += gameState.spills.length * 0.05;
    
    return Math.max(0.05, Math.min(0.5, rate));
}

// Rendering
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    const startGridX = Math.floor(-gameState.camera.x / (CONFIG.GRID_SIZE * gameState.camera.zoom)) - 1;
    const startGridY = Math.floor(-gameState.camera.y / (CONFIG.GRID_SIZE * gameState.camera.zoom)) - 1;
    const endGridX = Math.ceil((canvas.width - gameState.camera.x) / (CONFIG.GRID_SIZE * gameState.camera.zoom)) + 1;
    const endGridY = Math.ceil((canvas.height - gameState.camera.y) / (CONFIG.GRID_SIZE * gameState.camera.zoom)) + 1;
    
    for (let x = startGridX; x < endGridX; x++) {
        const worldX = x * CONFIG.GRID_SIZE * gameState.camera.zoom + gameState.camera.x;
        ctx.beginPath();
        ctx.moveTo(worldX, 0);
        ctx.lineTo(worldX, canvas.height);
        ctx.stroke();
    }
    
    for (let y = startGridY; y < endGridY; y++) {
        const worldY = y * CONFIG.GRID_SIZE * gameState.camera.zoom + gameState.camera.y;
        ctx.beginPath();
        ctx.moveTo(0, worldY);
        ctx.lineTo(canvas.width, worldY);
        ctx.stroke();
    }
    
    // Draw tiles
    for (let x = startGridX; x < endGridX; x++) {
        for (let y = startGridY; y < endGridY; y++) {
            const key = getGridKey(x, y);
            const tile = gameState.grid.get(key);
            
            if (!tile) continue;
            
            const worldX = x * CONFIG.GRID_SIZE * gameState.camera.zoom + gameState.camera.x;
            const worldY = y * CONFIG.GRID_SIZE * gameState.camera.zoom + gameState.camera.y;
            const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
            
            if (tile.type === 'floor') {
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(worldX, worldY, size, size);
                ctx.strokeStyle = '#3a3a3a';
                ctx.strokeRect(worldX, worldY, size, size);
            } else if (tile.type === 'entrance') {
                ctx.fillStyle = '#4a9eff';
                ctx.fillRect(worldX, worldY, size, size);
                ctx.fillStyle = '#fff';
                ctx.font = `${10 * gameState.camera.zoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('E', worldX + size / 2, worldY + size / 2 + 3 * gameState.camera.zoom);
            } else if (tile.type === 'shop') {
                // Only render shops on current floor
                if (tile.shop && tile.shop.floor === gameState.currentFloor) {
                    ctx.fillStyle = tile.shop.color;
                    ctx.fillRect(worldX, worldY, size, size);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(worldX, worldY, size, size);
                    
                    // Draw shop label
                    ctx.fillStyle = '#fff';
                    ctx.font = `${8 * gameState.camera.zoom}px Arial`;
                    ctx.textAlign = 'center';
                    const lines = tile.shop.name.split(' ');
                    lines.forEach((line, i) => {
                        ctx.fillText(line, worldX + size / 2, worldY + size / 2 + (i - 0.5) * 8 * gameState.camera.zoom);
                    });
                }
            } else if (tile.type === 'utility') {
                // Only render utilities on current floor
                if (tile.utility && tile.utility.floor === gameState.currentFloor) {
                    if (tile.utility.type === 'stairs') {
                        // Draw stairs
                        ctx.fillStyle = tile.utility.color;
                        ctx.fillRect(worldX + size * 0.2, worldY + size * 0.2, size * 0.6, size * 0.6);
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2 * gameState.camera.zoom;
                        ctx.strokeRect(worldX + size * 0.2, worldY + size * 0.2, size * 0.6, size * 0.6);
                        // Draw step lines
                        for (let i = 0; i < 3; i++) {
                            ctx.beginPath();
                            ctx.moveTo(worldX + size * 0.2, worldY + size * 0.2 + (i + 1) * size * 0.15);
                            ctx.lineTo(worldX + size * 0.8, worldY + size * 0.2 + (i + 1) * size * 0.15);
                            ctx.stroke();
                        }
                    } else if (tile.utility.type === 'elevator') {
                        // Draw elevator
                        ctx.fillStyle = tile.utility.color;
                        ctx.fillRect(worldX + size * 0.15, worldY + size * 0.15, size * 0.7, size * 0.7);
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2 * gameState.camera.zoom;
                        ctx.strokeRect(worldX + size * 0.15, worldY + size * 0.15, size * 0.7, size * 0.7);
                        // Draw elevator doors
                        ctx.fillStyle = '#333';
                        ctx.fillRect(worldX + size * 0.25, worldY + size * 0.3, size * 0.2, size * 0.4);
                        ctx.fillRect(worldX + size * 0.55, worldY + size * 0.3, size * 0.2, size * 0.4);
                    }
                }
            }
        }
    }
    
    // Draw customers (only on current floor)
    for (const customer of gameState.customers) {
        if (customer.floor !== gameState.currentFloor) continue;
        
        // Convert grid coordinates to world/screen coordinates
        const worldPos = gridToWorld(customer.x, customer.y);
        
        // Draw customer body (colored circle)
        ctx.fillStyle = customer.color;
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, 6 * gameState.camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline - red if injured
        if (customer.injured) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2.5 * gameState.camera.zoom;
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5 * gameState.camera.zoom;
        }
        ctx.stroke();
        
        // Draw wheelchair icon if disabled
        if (customer.disabled) {
            ctx.fillStyle = '#666';
            ctx.font = `${10 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('♿', worldPos.x, worldPos.y - 15 * gameState.camera.zoom);
        }
        
        // Draw injured indicator
        if (customer.injured) {
            ctx.fillStyle = '#ff0000';
            ctx.font = `bold ${10 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🚑', worldPos.x, worldPos.y - 25 * gameState.camera.zoom);
        }
        
        // Draw loyalty card indicator
        if (customer.loyaltyCard) {
            ctx.fillStyle = '#ffd700';
            ctx.font = `${8 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💳', worldPos.x + 8 * gameState.camera.zoom, worldPos.y - 8 * gameState.camera.zoom);
        }
        
        // Draw mini-map
    renderMiniMap();
    
    // Draw direction indicator (small dot showing direction)
        if (customer.state === 'walking' || customer.state === 'leaving') {
            const dx = customer.targetX - customer.x;
            const dy = customer.targetY - customer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const angle = Math.atan2(dy, dx);
                const indicatorX = worldPos.x + Math.cos(angle) * 8 * gameState.camera.zoom;
                const indicatorY = worldPos.y + Math.sin(angle) * 8 * gameState.camera.zoom;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(indicatorX, indicatorY, 2 * gameState.camera.zoom, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw bench indicator when resting
        if (customer.state === 'resting' || customer.usingBench) {
            ctx.fillStyle = '#4a9eff';
            ctx.font = `${8 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💺', worldPos.x, worldPos.y - 10 * gameState.camera.zoom);
        }
        
        // Draw conversation bubble
        if (customer.conversation) {
            const bubbleY = worldPos.y - 20 * gameState.camera.zoom;
            const textWidth = ctx.measureText(customer.conversation).width;
            const bubbleWidth = textWidth + 10 * gameState.camera.zoom;
            const bubbleHeight = 15 * gameState.camera.zoom;
            
            // Draw speech bubble
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5 * gameState.camera.zoom;
            
            // Bubble rectangle
            ctx.fillRect(worldPos.x - bubbleWidth / 2, bubbleY - bubbleHeight, bubbleWidth, bubbleHeight);
            ctx.strokeRect(worldPos.x - bubbleWidth / 2, bubbleY - bubbleHeight, bubbleWidth, bubbleHeight);
            
            // Bubble tail
            ctx.beginPath();
            ctx.moveTo(worldPos.x, bubbleY);
            ctx.lineTo(worldPos.x - 5 * gameState.camera.zoom, bubbleY + 5 * gameState.camera.zoom);
            ctx.lineTo(worldPos.x + 5 * gameState.camera.zoom, bubbleY + 5 * gameState.camera.zoom);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Text
            ctx.fillStyle = '#333';
            ctx.font = `${7 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(customer.conversation, worldPos.x, bubbleY - 5 * gameState.camera.zoom);
        }
    }
    
    // Draw break rooms (only on current floor)
    for (const breakRoom of gameState.breakRooms) {
        if (breakRoom.floor !== gameState.currentFloor) continue;
        
        const worldPos = gridToWorld(breakRoom.x, breakRoom.y);
        const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
        const width = (breakRoom.width || 4) * size;
        const height = (breakRoom.height || 3) * size;
        
        // Draw transparent break room zone
        ctx.fillStyle = 'rgba(139, 69, 19, 0.2)'; // Transparent brown
        ctx.fillRect(worldPos.x, worldPos.y, width, height);
        
        // Draw outline
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3 * gameState.camera.zoom;
        ctx.strokeRect(worldPos.x, worldPos.y, width, height);
        
        // Draw break room icon in center
        ctx.fillStyle = '#8b4513';
        ctx.font = `bold ${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('☕', worldPos.x + width / 2, worldPos.y + height / 2);
        
        // Draw items inside break room
        if (breakRoom.items && breakRoom.items.length > 0) {
            for (const item of breakRoom.items) {
                const itemWorldPos = gridToWorld(item.x, item.y);
                ctx.fillStyle = '#ffd700';
                ctx.font = `${size * 0.3}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(item.icon || '📦', itemWorldPos.x + size / 2, itemWorldPos.y + size * 0.6);
            }
        }
    }
    
    // Draw kitchens (only on current floor)
    for (const kitchen of gameState.kitchens) {
        if (kitchen.floor !== gameState.currentFloor) continue;
        
        const worldPos = gridToWorld(kitchen.x, kitchen.y);
        const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
        const width = (kitchen.width || 3) * size;
        const height = (kitchen.height || 4) * size;
        
        // Draw transparent kitchen zone
        ctx.fillStyle = 'rgba(255, 107, 107, 0.2)'; // Transparent red
        ctx.fillRect(worldPos.x, worldPos.y, width, height);
        
        // Draw outline
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3 * gameState.camera.zoom;
        ctx.strokeRect(worldPos.x, worldPos.y, width, height);
        
        // Draw kitchen icon in center with better design
        ctx.fillStyle = '#ff6b6b';
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('👨‍🍳', worldPos.x + width / 2, worldPos.y + height / 2);
        
        // Draw kitchen label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${size * 0.15}px Arial`;
        ctx.fillText('KITCHEN', worldPos.x + width / 2, worldPos.y + height - 2);
        
        // Draw items inside kitchen
        if (kitchen.items && kitchen.items.length > 0) {
            for (const item of kitchen.items) {
                const itemWorldPos = gridToWorld(item.x, item.y);
                ctx.fillStyle = '#ffd700';
                ctx.font = `${size * 0.3}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(item.icon || '📦', itemWorldPos.x + size / 2, itemWorldPos.y + size * 0.6);
            }
        }
    }
    
    // Draw utilities (only on current floor)
    for (const utility of gameState.utilities) {
        if (utility.floor !== gameState.currentFloor) continue;
        
        const worldPos = gridToWorld(utility.x, utility.y);
        const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
        
        if (utility.type === 'utility-customerservice') {
            // Draw Customer Service as a building with icon
            ctx.fillStyle = utility.color;
            ctx.fillRect(worldPos.x + size * 0.1, worldPos.y + size * 0.1, size * 0.8, size * 0.8);
            
            // Draw a service icon (question mark or info symbol)
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${size * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('?', worldPos.x + size / 2, worldPos.y + size * 0.65);
            
            // Draw outline
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2 * gameState.camera.zoom;
            ctx.strokeRect(worldPos.x + size * 0.1, worldPos.y + size * 0.1, size * 0.8, size * 0.8);
        }
    }
    
    // Draw decorations (only on current floor)
    for (const decoration of gameState.decorations) {
        if (decoration.floor !== gameState.currentFloor) continue;
        
        const worldPos = gridToWorld(decoration.x, decoration.y);
        const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
        
        ctx.fillStyle = decoration.color;
        if (decoration.type === 'decoration-bench') {
            // Draw bench as rectangle with rotation
            ctx.save();
            ctx.translate(worldPos.x + size / 2, worldPos.y + size / 2);
            ctx.rotate((decoration.rotation || 0) * Math.PI / 180);
            ctx.fillRect(-size * 0.3, -size * 0.1, size * 0.6, size * 0.2);
            ctx.restore();
        } else if (decoration.type === 'decoration-plant') {
            // Draw plant as circle
            ctx.beginPath();
            ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (decoration.type === 'decoration-fountain') {
            // Draw fountain as circle with water
            ctx.beginPath();
            ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4a9eff';
            ctx.beginPath();
            ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
        } else if (decoration.type === 'decoration-art') {
            // Draw art as square
            ctx.fillRect(worldPos.x + size * 0.25, worldPos.y + size * 0.25, size * 0.5, size * 0.5);
        } else if (decoration.type === 'decoration-trashbin') {
            // Draw trash bin as rectangle with lid
            ctx.fillStyle = decoration.color;
            ctx.fillRect(worldPos.x + size * 0.3, worldPos.y + size * 0.4, size * 0.4, size * 0.4);
            // Lid
            ctx.fillStyle = '#333';
            ctx.fillRect(worldPos.x + size * 0.25, worldPos.y + size * 0.35, size * 0.5, size * 0.1);
            // Handle
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1.5 * gameState.camera.zoom;
            ctx.beginPath();
            ctx.arc(worldPos.x + size * 0.5, worldPos.y + size * 0.4, size * 0.05, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw capacity indicator
            const capacity = decoration.trashLevel || 0;
            const maxCap = decoration.maxCapacity || CONFIG.TRASH_BIN_CAPACITY;
            if (capacity > 0) {
                // Fill level indicator
                const fillHeight = (capacity / maxCap) * size * 0.3;
                ctx.fillStyle = capacity >= maxCap ? '#ff6b6b' : '#8b4513';
                ctx.fillRect(worldPos.x + size * 0.32, worldPos.y + size * 0.7 - fillHeight, size * 0.36, fillHeight);
                
                // Text indicator
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${8 * gameState.camera.zoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2 * gameState.camera.zoom;
                const text = `${capacity}/${maxCap}`;
                ctx.strokeText(text, worldPos.x + size / 2, worldPos.y + size * 0.5);
                ctx.fillText(text, worldPos.x + size / 2, worldPos.y + size * 0.5);
            }
        }
    }
    
    // Draw spills
    for (const spill of gameState.spills) {
        const worldPos = gridToWorld(spill.x, spill.y);
        const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
        const centerX = worldPos.x + size / 2;
        const centerY = worldPos.y + size / 2;
        const radius = size * 0.35;
        
        // Draw spill with multiple splotches for more realistic look
        ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'; // Brown spill
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add smaller splotches around main spill
        ctx.fillStyle = 'rgba(101, 50, 14, 0.6)';
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const offsetX = Math.cos(angle) * radius * 0.4;
            const offsetY = Math.sin(angle) * radius * 0.4;
            ctx.beginPath();
            ctx.arc(centerX + offsetX, centerY + offsetY, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw outline
        ctx.strokeStyle = 'rgba(69, 34, 9, 0.9)';
        ctx.lineWidth = 1.5 * gameState.camera.zoom;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw click indicator
        if (spill.clicks > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${9 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2 * gameState.camera.zoom;
            const text = `${spill.clicks}/${CONFIG.SPILL_CLEAN_CLICKS}`;
            ctx.strokeText(text, centerX, centerY + 3 * gameState.camera.zoom);
            ctx.fillText(text, centerX, centerY + 3 * gameState.camera.zoom);
        }
    }
    
    // Draw janitors
    for (const janitor of gameState.janitors) {
        const worldPos = gridToWorld(janitor.x, janitor.y);
        
        // Draw janitor (blue circle, green when resting, yellow when boosted)
        if (janitor.state === 'resting') {
            ctx.fillStyle = '#00cc00';
        } else if (janitor.breakRoomBoost > 0) {
            ctx.fillStyle = '#ffd700'; // Gold when boosted
        } else {
            ctx.fillStyle = '#0066cc';
        }
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, 5 * gameState.camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5 * gameState.camera.zoom;
        ctx.stroke();
        
        // Draw rest indicator
        if (janitor.state === 'resting') {
            ctx.fillStyle = '#fff';
            ctx.font = `${8 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            // Show different icon based on what item they're using
            if (janitor.targetBreakRoomItem) {
                const itemIcon = janitor.targetBreakRoomItem.icon || '💤';
                ctx.fillText(itemIcon, worldPos.x, worldPos.y - 10 * gameState.camera.zoom);
            } else {
                ctx.fillText('💤', worldPos.x, worldPos.y - 10 * gameState.camera.zoom);
            }
        }
        
        // Draw boost indicator
        if (janitor.breakRoomBoost > 0 && janitor.state !== 'resting') {
            ctx.fillStyle = '#ffd700';
            ctx.font = `${6 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('⚡', worldPos.x + 8 * gameState.camera.zoom, worldPos.y - 8 * gameState.camera.zoom);
        }
        
        // Draw progress bar when cleaning or emptying
        if ((janitor.state === 'cleaning' || janitor.state === 'emptying') && janitor.cleaningProgress) {
            const progress = janitor.cleaningProgress / CONFIG.JANITOR_CLEAN_TIME;
            const barWidth = 20 * gameState.camera.zoom;
            const barHeight = 3 * gameState.camera.zoom;
            const barX = worldPos.x - barWidth / 2;
            const barY = worldPos.y - 12 * gameState.camera.zoom;
            
            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Progress (blue for cleaning, green for emptying)
            ctx.fillStyle = janitor.state === 'emptying' ? '#06ffa5' : '#4a9eff';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 * gameState.camera.zoom;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
    
    // Draw chefs (only on current floor)
    for (const chef of gameState.chefs) {
        const worldPos = gridToWorld(chef.x, chef.y);
        
        // Draw chef with better design - chef hat and body
        if (chef.state === 'cooking') {
            ctx.fillStyle = '#ff6b6b'; // Red when cooking
        } else if (chef.hasFood) {
            ctx.fillStyle = '#ffa500'; // Orange when carrying food
        } else if (chef.state === 'resting') {
            ctx.fillStyle = '#90ee90'; // Light green when resting
        } else {
            ctx.fillStyle = '#ff8c00'; // Dark orange normally
        }
        
        // Draw chef body (circle)
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, 6 * gameState.camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw chef hat (white tall hat)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y - 4 * gameState.camera.zoom, 4 * gameState.camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(worldPos.x - 3 * gameState.camera.zoom, worldPos.y - 8 * gameState.camera.zoom, 6 * gameState.camera.zoom, 4 * gameState.camera.zoom);
        
        // Draw outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5 * gameState.camera.zoom;
        ctx.stroke();
        
        // Draw cooking indicator
        if (chef.state === 'cooking') {
            ctx.fillStyle = '#fff';
            ctx.font = `${10 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🔥', worldPos.x, worldPos.y - 15 * gameState.camera.zoom);
            
            // Draw cooking progress bar
            const progress = chef.cookingProgress / CONFIG.CHEF_COOK_TIME;
            const barWidth = 24 * gameState.camera.zoom;
            const barHeight = 4 * gameState.camera.zoom;
            const barX = worldPos.x - barWidth / 2;
            const barY = worldPos.y - 20 * gameState.camera.zoom;
            
            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            // Progress
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 * gameState.camera.zoom;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Draw food indicator
        if (chef.hasFood) {
            ctx.fillStyle = '#fff';
            ctx.font = `${8 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🍽️', worldPos.x + 10 * gameState.camera.zoom, worldPos.y - 10 * gameState.camera.zoom);
        }
        
        // Draw resting indicator
        if (chef.state === 'resting') {
            ctx.fillStyle = '#fff';
            ctx.font = `${8 * gameState.camera.zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💤', worldPos.x, worldPos.y - 15 * gameState.camera.zoom);
        }
    }
    
    // Draw hospital staff (only on current floor)
    for (const staff of gameState.hospitalStaff) {
        if (staff.floor !== gameState.currentFloor) continue;
        
        const worldPos = gridToWorld(staff.x, staff.y);
        
        // Draw hospital staff (white circle with red cross)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, 6 * gameState.camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5 * gameState.camera.zoom;
        ctx.stroke();
        
        // Draw red cross
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2 * gameState.camera.zoom;
        ctx.beginPath();
        ctx.moveTo(worldPos.x - 4 * gameState.camera.zoom, worldPos.y);
        ctx.lineTo(worldPos.x + 4 * gameState.camera.zoom, worldPos.y);
        ctx.moveTo(worldPos.x, worldPos.y - 4 * gameState.camera.zoom);
        ctx.lineTo(worldPos.x, worldPos.y + 4 * gameState.camera.zoom);
        ctx.stroke();
    }
    
    // Draw preview (will be updated on mousemove)
    if (gameState.selectedBuildType && gameState.previewPos) {
        const gridPos = worldToGrid(gameState.previewPos.x, gameState.previewPos.y);
        const worldPos = gridToWorld(gridPos.x, gridPos.y);
        const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
        
        ctx.globalAlpha = 0.5;
        if (gameState.selectedBuildType === 'floor') {
            ctx.fillStyle = canPlaceBuilding(gridPos.x, gridPos.y, 'floor') ? '#4a9eff' : '#ff6b6b';
            ctx.fillRect(worldPos.x, worldPos.y, size, size);
        } else if (gameState.selectedBuildType.startsWith('shop-')) {
            const shopConfig = CONFIG.SHOP_TYPES[gameState.selectedBuildType];
            ctx.fillStyle = canPlaceBuilding(gridPos.x, gridPos.y, gameState.selectedBuildType) ? shopConfig.color : '#ff6b6b';
            ctx.fillRect(worldPos.x, worldPos.y, size, size);
        } else if (gameState.selectedBuildType === 'entrance') {
            ctx.fillStyle = canPlaceBuilding(gridPos.x, gridPos.y, 'entrance') ? '#4a9eff' : '#ff6b6b';
            ctx.fillRect(worldPos.x, worldPos.y, size, size);
        } else if (gameState.selectedBuildType.startsWith('decoration-')) {
            const decConfig = CONFIG.DECORATION_TYPES[gameState.selectedBuildType];
            if (decConfig) {
                const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, gameState.selectedBuildType);
                ctx.fillStyle = canPlace ? decConfig.color : '#ff6b6b';
                
                // Draw preview based on decoration type
                if (gameState.selectedBuildType === 'decoration-bench') {
                    ctx.fillRect(worldPos.x + size * 0.2, worldPos.y + size * 0.6, size * 0.6, size * 0.2);
                } else if (gameState.selectedBuildType === 'decoration-bench') {
                    // Draw bench preview (default rotation 0)
                    ctx.save();
                    ctx.translate(worldPos.x + size / 2, worldPos.y + size / 2);
                    ctx.fillRect(-size * 0.3, -size * 0.1, size * 0.6, size * 0.2);
                    ctx.restore();
                } else if (gameState.selectedBuildType === 'decoration-plant') {
                    ctx.beginPath();
                    ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (gameState.selectedBuildType === 'decoration-fountain') {
                    ctx.beginPath();
                    ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = canPlace ? '#4a9eff' : '#ff6b6b';
                    ctx.beginPath();
                    ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                } else if (gameState.selectedBuildType === 'decoration-art') {
                    ctx.fillRect(worldPos.x + size * 0.25, worldPos.y + size * 0.25, size * 0.5, size * 0.5);
                } else if (gameState.selectedBuildType === 'decoration-trashbin') {
                    // Draw trash bin as rectangle with lid
                    ctx.fillRect(worldPos.x + size * 0.3, worldPos.y + size * 0.4, size * 0.4, size * 0.4);
                    const lidColor = canPlace ? '#333' : '#ff6b6b';
                    ctx.fillStyle = lidColor;
                    ctx.fillRect(worldPos.x + size * 0.25, worldPos.y + size * 0.35, size * 0.5, size * 0.1);
                    // Handle
                    ctx.strokeStyle = canPlace ? '#666' : '#ff6b6b';
                    ctx.lineWidth = 1.5 * gameState.camera.zoom;
                    ctx.beginPath();
                    ctx.arc(worldPos.x + size * 0.5, worldPos.y + size * 0.4, size * 0.05, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        } else if (gameState.selectedBuildType === 'janitor') {
            const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, 'janitor');
            ctx.fillStyle = canPlace ? '#0066cc' : '#ff6b6b';
            ctx.beginPath();
            ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
        } else if (gameState.selectedBuildType.startsWith('utility-')) {
            const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, gameState.selectedBuildType);
            if (gameState.selectedBuildType === 'utility-customerservice') {
                ctx.fillStyle = canPlace ? '#9b59b6' : '#ff6b6b';
                ctx.fillRect(worldPos.x + size * 0.1, worldPos.y + size * 0.1, size * 0.8, size * 0.8);
                
                // Draw preview icon
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${size * 0.4}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('?', worldPos.x + size / 2, worldPos.y + size * 0.65);
                
                // Draw outline
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2 * gameState.camera.zoom;
                ctx.strokeRect(worldPos.x + size * 0.1, worldPos.y + size * 0.1, size * 0.8, size * 0.8);
            }
            ctx.lineWidth = 1.5 * gameState.camera.zoom;
            ctx.stroke();
        } else if (gameState.selectedBuildType === 'breakroom') {
            const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, 'breakroom');
            const previewWidth = 4 * size;
            const previewHeight = 3 * size;
            
            // Draw transparent preview zone
            ctx.fillStyle = canPlace ? 'rgba(139, 69, 19, 0.2)' : 'rgba(255, 107, 107, 0.2)';
            ctx.fillRect(worldPos.x, worldPos.y, previewWidth, previewHeight);
            
            // Draw outline
            ctx.strokeStyle = canPlace ? '#8b4513' : '#ff6b6b';
            ctx.lineWidth = 3 * gameState.camera.zoom;
            ctx.strokeRect(worldPos.x, worldPos.y, previewWidth, previewHeight);
            
            // Draw preview icon in center
            ctx.fillStyle = canPlace ? '#8b4513' : '#ff6b6b';
            ctx.font = `bold ${size * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('☕', worldPos.x + previewWidth / 2, worldPos.y + previewHeight / 2);
        } else if (gameState.selectedBuildType.startsWith('breakroom-')) {
            const itemConfig = CONFIG.BREAK_ROOM_ITEMS[gameState.selectedBuildType];
            if (itemConfig) {
                const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, gameState.selectedBuildType);
                ctx.fillStyle = canPlace ? '#ffd700' : '#ff6b6b';
                ctx.font = `${size * 0.25}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(itemConfig.icon || '📦', worldPos.x + size / 2, worldPos.y + size * 0.6);
            }
        } else if (gameState.selectedBuildType === 'kitchen') {
            const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, 'kitchen');
            const previewWidth = 3 * size;
            const previewHeight = 4 * size;
            
            // Draw transparent preview zone
            ctx.fillStyle = canPlace ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.2)';
            ctx.fillRect(worldPos.x, worldPos.y, previewWidth, previewHeight);
            
            // Draw outline
            ctx.strokeStyle = canPlace ? '#ff6b6b' : '#ff0000';
            ctx.lineWidth = 3 * gameState.camera.zoom;
            ctx.strokeRect(worldPos.x, worldPos.y, previewWidth, previewHeight);
            
            // Draw preview icon in center
            ctx.fillStyle = canPlace ? '#ff6b6b' : '#ff0000';
            ctx.font = `bold ${size * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('👨‍🍳', worldPos.x + previewWidth / 2, worldPos.y + previewHeight / 2);
        } else if (gameState.selectedBuildType.startsWith('kitchen-')) {
            const itemConfig = CONFIG.KITCHEN_ITEMS[gameState.selectedBuildType];
            if (itemConfig) {
                const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, gameState.selectedBuildType);
                ctx.fillStyle = canPlace ? '#ffd700' : '#ff6b6b';
                ctx.font = `${size * 0.3}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(itemConfig.icon || '📦', worldPos.x + size / 2, worldPos.y + size * 0.6);
            }
        } else if (gameState.selectedBuildType === 'chef') {
            const canPlace = canPlaceBuilding(gridPos.x, gridPos.y, 'chef');
            ctx.fillStyle = canPlace ? '#ff8c00' : '#ff6b6b';
            ctx.beginPath();
            ctx.arc(worldPos.x + size / 2, worldPos.y + size / 2, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
        }
        ctx.globalAlpha = 1.0;
    }
    
    // Draw mini-map
    renderMiniMap();
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Game Loop
let lastTime = Date.now();
function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update day
    const dayProgress = (currentTime - gameState.dayStartTime) / CONFIG.DAY_DURATION;
    if (dayProgress >= 1) {
        gameState.day++;
        gameState.dayStartTime = currentTime;
        gameState.dailyIncome = 0;
    }
    
    // Check special events
    checkSpecialEvents();
    
    // Spawn customers (dynamic rate based on reviews)
    const spawnRate = getCustomerSpawnRate();
    if (Math.random() < spawnRate && gameState.shops.length > 0 && gameState.entrances.length > 0) {
        spawnCustomer();
    }
    
    // Customer leave rate (based on reviews)
    const leaveRate = getCustomerLeaveRate();
    if (Math.random() < leaveRate * (deltaTime / 1000)) {
        if (gameState.customers.length > 0) {
            const randomIndex = Math.floor(Math.random() * gameState.customers.length);
            const customer = gameState.customers[randomIndex];
            if (customer.state === 'shopping' || customer.state === 'walking') {
                // Customer leaves early due to poor experience
                if (customer.targetShop) {
                    customer.targetShop.customers--;
                }
                gameState.customers.splice(randomIndex, 1);
            }
        }
    }
    
    // Spills are now spawned when customers finish shopping at food stores
    // (handled in updateCustomers function)
    
    // Update systems
    updateCustomers(deltaTime);
    updateCustomerBenchInteraction(deltaTime);
    updateJanitors(deltaTime);
    updateChefs(deltaTime);
    updateHospitalStaff(deltaTime);
    
    // Pay janitors (daily)
    if (currentTime - gameState.lastJanitorPay >= CONFIG.DAY_DURATION) {
        const janitorCost = gameState.janitors.length * CONFIG.JANITOR_SALARY;
        
        // If can't pay, employees start leaving
        if (gameState.money < janitorCost) {
            // Employees leave if unpaid
            for (let i = gameState.janitors.length - 1; i >= 0; i--) {
                if (Math.random() < CONFIG.EMPLOYEE_LEAVE_CHANCE) {
                    gameState.janitors.splice(i, 1);
                }
            }
        } else {
            gameState.money -= janitorCost;
        }
        gameState.lastJanitorPay = currentTime;
    }
    
    // Update UI
    updateUI();
    
    // Check tutorial progress
    checkTutorialProgress();
    
    // Render
    render();
    
    requestAnimationFrame(gameLoop);
}

// UI Updates
function updateUI() {
    document.getElementById('money').textContent = `$${Math.floor(gameState.money)}`;
    document.getElementById('daily-income').textContent = `$${Math.floor(gameState.dailyIncome)}`;
    document.getElementById('shop-count').textContent = gameState.shops.length;
    document.getElementById('customer-count').textContent = `${gameState.customers.length}/${getMaxCustomers()}`;
    document.getElementById('day').textContent = gameState.day;
    
    // Update entrance cost
    const entranceBtn = document.getElementById('entrance-btn');
    if (entranceBtn) {
        let entranceCost = 0;
        if (gameState.entrances.length > 0) {
            entranceCost = CONFIG.ENTRANCE_BASE_COST + (gameState.entrances.length * CONFIG.ENTRANCE_COST_INCREMENT);
        }
        entranceBtn.textContent = entranceCost === 0 ? 'Entrance (Free)' : `Entrance ($${entranceCost})`;
    }
    
    // Update review display
    const reviewElement = document.getElementById('review');
    if (reviewElement) {
        const stars = '★'.repeat(Math.floor(gameState.review)) + '☆'.repeat(5 - Math.floor(gameState.review));
        reviewElement.textContent = `${stars} (${gameState.review.toFixed(1)})`;
    }
    
    // Update events display
    const eventsElement = document.getElementById('events');
    if (eventsElement) {
        const activeEvents = gameState.events.filter(e => e.active);
        if (activeEvents.length > 0) {
            eventsElement.innerHTML = activeEvents.map(e => 
                `<div class="event-item">${e.name}: ${e.description}</div>`
            ).join('');
        } else {
            eventsElement.innerHTML = '';
        }
    }
    
    // Update spills/janitors display
    const spillsElement = document.getElementById('spills-count');
    if (spillsElement) {
        spillsElement.textContent = gameState.spills.length;
    }
    
    const janitorsElement = document.getElementById('janitors-count');
    if (janitorsElement) {
        janitorsElement.textContent = gameState.janitors.length;
    }
    
    // Update Customer Service button
    const customerServiceBtn = document.getElementById('customerservice-btn');
    if (customerServiceBtn) {
        const existingServices = gameState.utilities.filter(u => u.type === 'utility-customerservice');
        const isUnlocked = gameState.day >= CONFIG.CUSTOMER_SERVICE_UNLOCK_DAY;
        const isMaxReached = existingServices.length >= CONFIG.CUSTOMER_SERVICE_MAX;
        const canAfford = gameState.money >= CONFIG.CUSTOMER_SERVICE_COST;
        
        if (!isUnlocked) {
            customerServiceBtn.disabled = true;
            customerServiceBtn.textContent = `Customer Service (Unlocks Day ${CONFIG.CUSTOMER_SERVICE_UNLOCK_DAY})`;
        } else if (isMaxReached) {
            customerServiceBtn.disabled = true;
            customerServiceBtn.textContent = `Customer Service (Max: ${CONFIG.CUSTOMER_SERVICE_MAX})`;
        } else {
            customerServiceBtn.disabled = false;
            customerServiceBtn.textContent = `Customer Service ($${CONFIG.CUSTOMER_SERVICE_COST})`;
        }
    }
    
    // Update Stairs button
    const stairsBtn = document.getElementById('stairs-btn');
    if (stairsBtn) {
        const isUnlocked = gameState.day >= CONFIG.STAIRS_UNLOCK_DAY;
        if (!isUnlocked) {
            stairsBtn.disabled = true;
            stairsBtn.textContent = `Stairs (Unlocks Day ${CONFIG.STAIRS_UNLOCK_DAY})`;
        } else {
            stairsBtn.disabled = false;
            stairsBtn.textContent = `Stairs ($${CONFIG.STAIRS_COST})`;
        }
    }
    
    // Update Elevator button
    const elevatorBtn = document.getElementById('elevator-btn');
    if (elevatorBtn) {
        const hasStairs = gameState.utilities.some(u => u.type === 'stairs');
        const hasElevatorOnFloor = gameState.utilities.some(u => u.type === 'elevator' && u.floor === gameState.currentFloor);
        if (!hasStairs) {
            elevatorBtn.disabled = true;
            elevatorBtn.textContent = 'Elevator (Build Stairs First)';
        } else if (hasElevatorOnFloor) {
            elevatorBtn.disabled = true;
            elevatorBtn.textContent = 'Elevator (1 per floor)';
        } else {
            elevatorBtn.disabled = false;
            elevatorBtn.textContent = `Elevator ($${CONFIG.ELEVATOR_COST})`;
        }
    }
    
    // Update floor display
    const currentFloorElement = document.getElementById('current-floor');
    if (currentFloorElement) {
        currentFloorElement.textContent = `Floor ${gameState.currentFloor}`;
    }
    
    const floorDownBtn = document.getElementById('floor-down-btn');
    if (floorDownBtn) {
        floorDownBtn.disabled = gameState.currentFloor === 0;
    }
    
    const floorUpBtn = document.getElementById('floor-up-btn');
    if (floorUpBtn) {
        floorUpBtn.disabled = gameState.currentFloor >= gameState.floors.length - 1;
    }
    
    // Don't auto-update staff management panel - it closes dropdowns
    // Panel will be updated when opened or when staff changes
}

function updateShopList() {
    const shopList = document.getElementById('shop-list');
    shopList.innerHTML = '';
    
    gameState.shops.forEach(shop => {
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `
            <h3>${shop.name}</h3>
            <p>Income: $${shop.income}/customer</p>
            <p>Customers: ${shop.customers}</p>
        `;
        shopList.appendChild(shopItem);
    });
}

// Update Staff Management Panel
function updateStaffManagementPanel() {
    const staffList = document.getElementById('staff-list');
    if (!staffList) return;
    
    staffList.innerHTML = '';
    
    // Add Janitors
    gameState.janitors.forEach(janitor => {
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        const stateText = janitor.state === 'idle' ? 'Idle' : 
                         janitor.state === 'cleaning' ? 'Cleaning' :
                         janitor.state === 'emptying' ? 'Emptying Trash' :
                         janitor.state === 'resting' ? 'Resting' : 'Working';
        const assignedText = janitor.assignedFloor !== null ? `Floor ${janitor.assignedFloor}` : 'All Floors';
        
        staffItem.innerHTML = `
            <div class="staff-header">
                <h3>${janitor.name || 'Janitor'}</h3>
                <button class="fire-btn" data-staff-id="${janitor.id}" data-staff-type="janitor">Fire</button>
            </div>
            <p><strong>Status:</strong> ${stateText}</p>
            <p><strong>Assigned:</strong> ${assignedText}</p>
            <p><strong>Tasks Completed:</strong> ${janitor.tasksCompleted || 0}</p>
            <div class="staff-assign">
                <label>Assign to Floor:</label>
                <select class="floor-assign" data-staff-id="${janitor.id}" data-staff-type="janitor">
                    <option value="null" ${janitor.assignedFloor === null ? 'selected' : ''}>All Floors</option>
                    ${gameState.floors.map(f => `<option value="${f}" ${janitor.assignedFloor === f ? 'selected' : ''}>Floor ${f}</option>`).join('')}
                </select>
            </div>
        `;
        staffList.appendChild(staffItem);
    });
    
    // Add Chefs
    gameState.chefs.forEach(chef => {
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        const stateText = chef.state === 'idle' ? 'Idle' : 
                         chef.state === 'cooking' ? 'Cooking' :
                         chef.state === 'going-to-customer' ? 'Delivering' :
                         chef.state === 'resting' ? 'Resting' : 'Working';
        const assignedFloorText = chef.assignedFloor !== null ? `Floor ${chef.assignedFloor}` : 'All Floors';
        const assignedKitchenText = chef.assignedKitchen ? 
            gameState.kitchens.find(k => k.id === chef.assignedKitchen)?.name || 'Kitchen' : 'Any Kitchen';
        
        staffItem.innerHTML = `
            <div class="staff-header">
                <h3>${chef.name || 'Chef'}</h3>
                <button class="fire-btn" data-staff-id="${chef.id}" data-staff-type="chef">Fire</button>
            </div>
            <p><strong>Status:</strong> ${stateText}</p>
            <p><strong>Assigned Floor:</strong> ${assignedFloorText}</p>
            <p><strong>Assigned Kitchen:</strong> ${assignedKitchenText}</p>
            <p><strong>Meals Cooked:</strong> ${chef.mealsCooked || 0}</p>
            <div class="staff-assign">
                <label>Assign to Floor:</label>
                <select class="floor-assign" data-staff-id="${chef.id}" data-staff-type="chef">
                    <option value="null" ${chef.assignedFloor === null ? 'selected' : ''}>All Floors</option>
                    ${gameState.floors.map(f => `<option value="${f}" ${chef.assignedFloor === f ? 'selected' : ''}>Floor ${f}</option>`).join('')}
                </select>
                <label>Assign to Kitchen:</label>
                <select class="kitchen-assign" data-staff-id="${chef.id}">
                    <option value="null" ${chef.assignedKitchen === null ? 'selected' : ''}>Any Kitchen</option>
                    ${gameState.kitchens.map(k => `<option value="${k.id}" ${chef.assignedKitchen === k.id ? 'selected' : ''}>Kitchen (Floor ${k.floor})</option>`).join('')}
                </select>
            </div>
        `;
        staffList.appendChild(staffItem);
    });
    
    if (gameState.janitors.length === 0 && gameState.chefs.length === 0) {
        staffList.innerHTML = '<p style="text-align: center; padding: 20px;">No staff hired yet. Hire staff from the Staff panel!</p>';
    }
}

// Event Listeners
document.querySelectorAll('.build-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Don't allow selection of disabled buttons
        if (btn.disabled) {
            return;
        }
        
        // If clicking the same button, unselect it
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            gameState.selectedBuildType = null;
        } else {
            // Select new button
            document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.selectedBuildType = btn.dataset.type;
        }
    });
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const gridPos = worldToGrid(mouseX, mouseY);
    
    // Check if clicking on a customer (when no building selected)
    let clickedCustomer = false;
    if (!gameState.selectedBuildType) {
        for (const customer of gameState.customers) {
            if (customer.floor !== gameState.currentFloor) continue;
            const worldPos = gridToWorld(customer.x, customer.y);
            const dx = mouseX - worldPos.x;
            const dy = mouseY - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10 * gameState.camera.zoom) {
                // Show customer info panel
                showCustomerInfo(customer);
                clickedCustomer = true;
                break;
            }
        }
    }
    
    // Check if clicking on a bench to rotate it
    let clickedBench = false;
    if (!gameState.selectedBuildType && !clickedCustomer) {
        for (const bench of gameState.decorations.filter(d => d.isBench && d.floor === gameState.currentFloor)) {
            const worldPos = gridToWorld(bench.x, bench.y);
            const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
            const dx = mouseX - (worldPos.x + size / 2);
            const dy = mouseY - (worldPos.y + size / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < size * 0.5) {
                // Rotate bench (0 -> 90 -> 180 -> 270 -> 0)
                bench.rotation = ((bench.rotation || 0) + 90) % 360;
                clickedBench = true;
                break;
            }
        }
    }
    
    // Check if clicking on a trash bin to empty it
    let clickedTrashBin = false;
    if (!clickedBench && !gameState.selectedBuildType) {
        for (const trashBin of gameState.decorations.filter(d => d.type === 'decoration-trashbin')) {
            const worldPos = gridToWorld(trashBin.x, trashBin.y);
            const size = CONFIG.GRID_SIZE * gameState.camera.zoom;
            const dx = mouseX - (worldPos.x + size / 2);
            const dy = mouseY - (worldPos.y + size / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < size * 0.5 && trashBin.trashLevel > 0 && !trashBin.beingEmptied) {
                trashBin.trashLevel = 0;
                clickedTrashBin = true;
                break;
            }
        }
    }
    
    // Check if clicking on a spill
    let clickedSpill = false;
    if (!clickedBench && !clickedTrashBin) {
        for (const spill of gameState.spills) {
            const worldPos = gridToWorld(spill.x, spill.y);
            const dx = mouseX - worldPos.x;
            const dy = mouseY - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < CONFIG.GRID_SIZE * gameState.camera.zoom * 0.5) {
                cleanSpill(spill.id, false);
                clickedSpill = true;
                break;
            }
        }
    }
    
    // If not clicking on spill/bench/trashbin/customer and have build type selected, place building
    if (!clickedSpill && !clickedBench && !clickedTrashBin && !clickedCustomer && gameState.selectedBuildType) {
        placeBuilding(gridPos.x, gridPos.y, gameState.selectedBuildType);
        updateUI();
    } else if (clickedSpill || clickedBench || clickedTrashBin) {
        updateUI();
    }
});

// Show customer info panel
function showCustomerInfo(customer) {
    const panel = document.getElementById('customer-info-panel');
    const content = document.getElementById('customer-info-content');
    
    if (!panel || !content) return;
    
    const shoppingListText = customer.shoppingList && customer.shoppingList.length > 0
        ? customer.shoppingList.map((shop, idx) => `${idx + 1}. ${shop.name || shop.type || 'Shop'}`).join('<br>')
        : 'None';
    
    const thoughtText = customer.thought || customer.conversation || 'Just shopping...';
    const disabledText = customer.disabled ? 'Yes (Wheelchair)' : 'No';
    const injuredText = customer.injured ? 'Yes (Broken Legs)' : 'No';
    const loyaltyText = customer.loyaltyCard ? `Yes (${customer.visitCount} visits)` : 'No';
    
    content.innerHTML = `
        <p><strong>Name:</strong> ${customer.name || 'Unknown'}</p>
        <p><strong>Loyalty Card:</strong> ${loyaltyText}</p>
        <p><strong>Disabled:</strong> ${disabledText}</p>
        <p><strong>Injured:</strong> ${injuredText}</p>
        <p><strong>State:</strong> ${customer.state}</p>
        <p><strong>Floor:</strong> ${customer.floor}</p>
        <p><strong>Shopping List:</strong><br>${shoppingListText}</p>
        <p><strong>Thought:</strong> ${thoughtText}</p>
    `;
    
    panel.style.display = 'block';
}

// Close customer info panel
document.getElementById('close-customer-info')?.addEventListener('click', () => {
    const panel = document.getElementById('customer-info-panel');
    if (panel) {
        panel.style.display = 'none';
    }
});

// Floor switching
document.getElementById('floor-down-btn')?.addEventListener('click', () => {
    if (gameState.currentFloor > 0) {
        gameState.currentFloor--;
        updateUI();
    }
});

document.getElementById('floor-up-btn')?.addEventListener('click', () => {
    if (gameState.currentFloor < gameState.floors.length - 1) {
        gameState.currentFloor++;
        updateUI();
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        gameState.isDragging = true;
        gameState.dragStart = { x: e.clientX - gameState.camera.x, y: e.clientY - gameState.camera.y };
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (gameState.isDragging) {
        gameState.camera.x = e.clientX - gameState.dragStart.x;
        gameState.camera.y = e.clientY - gameState.dragStart.y;
    } else {
        // Update preview position
        const rect = canvas.getBoundingClientRect();
        gameState.previewPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
});

canvas.addEventListener('mouseup', () => {
    gameState.isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    gameState.camera.zoom = Math.max(0.5, Math.min(2, gameState.camera.zoom * zoomFactor));
});

// Prevent context menu
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Tutorial System
const TUTORIAL_STEPS = [
    {
        title: 'Welcome to Mall Tycoon!',
        content: 'Welcome! You\'re the manager of a new mall. Your goal is to build shops, attract customers, and make money. Let\'s get started!',
        checkComplete: () => true
    },
    {
        title: 'Build Your First Floor',
        content: 'First, you need to build floors for your mall. Click the "Floor ($50)" button, then click on the canvas to place floor tiles. Try placing a few floor tiles!',
        checkComplete: () => {
            let floorCount = 0;
            for (const tile of gameState.grid.values()) {
                if (tile.type === 'floor') floorCount++;
            }
            return floorCount >= 3;
        }
    },
    {
        title: 'Add an Entrance',
        content: 'Customers need a way to enter your mall! Click the "Entrance (Free)" button and place it on a floor tile. The first entrance is free!',
        checkComplete: () => gameState.entrances.length >= 1
    },
    {
        title: 'Build Your First Shop',
        content: 'Now let\'s add a shop! Click on any shop button (like "Food Shop") and place it on a floor tile. Shops generate income when customers visit them!',
        checkComplete: () => gameState.shops.length >= 1
    },
    {
        title: 'Customers Arrive!',
        content: 'Great! Customers will start arriving at your entrance. They\'ll visit your shops and spend money. Watch your money increase in the stats panel!',
        checkComplete: () => gameState.customers.length > 0
    },
    {
        title: 'Add Decorations',
        content: 'Decorations like benches, plants, and fountains improve your mall\'s review rating. Better reviews attract more customers! Try adding a decoration.',
        checkComplete: () => gameState.decorations.length >= 1
    },
    {
        title: 'Hire Staff',
        content: 'As your mall grows, you\'ll need janitors to clean spills. Click "Hire Janitor" and place them on floor tiles. They automatically clean messes!',
        checkComplete: () => gameState.janitors.length >= 1
    },
    {
        title: 'Customer Groups',
        content: 'Different customer groups visit your mall: Families (pink), Teens (red), Seniors (light blue), and Adults (teal). Each group has different preferences and spending habits!',
        checkComplete: () => {
            const groups = new Set(gameState.customers.map(c => c.group));
            return groups.size >= 2;
        }
    },
    {
        title: 'Loyalty Cards',
        content: 'Customers who visit multiple times get loyalty cards (💳). They spend 20% more! Check customer info by clicking on them when no building is selected.',
        checkComplete: () => {
            return gameState.customers.some(c => c.loyaltyCard) || gameState.loyaltyCardHolders.size > 0;
        }
    },
    {
        title: 'You\'re Ready!',
        content: 'You\'ve learned the basics! Keep building, expanding, and managing your mall. Try building multiple floors with stairs and elevators, and watch your empire grow!',
        checkComplete: () => true
    }
];

function showTutorial() {
    if (!gameState.tutorial.active) return;
    
    const panel = document.getElementById('tutorial-panel');
    const title = document.getElementById('tutorial-title');
    const content = document.getElementById('tutorial-content');
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    const skipBtn = document.getElementById('tutorial-skip');
    
    if (!panel || !title || !content) return;
    
    const step = TUTORIAL_STEPS[gameState.tutorial.currentStep];
    if (!step) {
        gameState.tutorial.active = false;
        panel.style.display = 'none';
        return;
    }
    
    title.textContent = step.title;
    content.textContent = step.content;
    
    // Show/hide buttons
    prevBtn.style.display = gameState.tutorial.currentStep > 0 ? 'inline-block' : 'none';
    nextBtn.textContent = gameState.tutorial.currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
    
    panel.style.display = 'block';
    
    // Check if step is complete
    if (step.checkComplete && step.checkComplete()) {
        if (!gameState.tutorial.completed.includes(gameState.tutorial.currentStep)) {
            gameState.tutorial.completed.push(gameState.tutorial.currentStep);
        }
    }
}

function nextTutorialStep() {
    if (gameState.tutorial.currentStep < TUTORIAL_STEPS.length - 1) {
        gameState.tutorial.currentStep++;
        showTutorial();
    } else {
        // Tutorial complete
        gameState.tutorial.active = false;
        document.getElementById('tutorial-panel').style.display = 'none';
    }
}

function prevTutorialStep() {
    if (gameState.tutorial.currentStep > 0) {
        gameState.tutorial.currentStep--;
        showTutorial();
    }
}

function skipTutorial() {
    gameState.tutorial.active = false;
    document.getElementById('tutorial-panel').style.display = 'none';
}

// Tutorial event listeners
document.getElementById('tutorial-next')?.addEventListener('click', nextTutorialStep);
document.getElementById('tutorial-prev')?.addEventListener('click', prevTutorialStep);
document.getElementById('tutorial-skip')?.addEventListener('click', skipTutorial);

// Staff Management Panel
document.getElementById('staff-management-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('staff-management-panel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            updateStaffManagementPanel();
        }
    }
});

// Stop event propagation for dropdowns to prevent panel from closing
document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'SELECT' || e.target.closest('.staff-assign')) {
        e.stopPropagation();
    }
});

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'SELECT' || e.target.closest('.staff-assign')) {
        e.stopPropagation();
    }
});

document.getElementById('close-staff-panel')?.addEventListener('click', () => {
    const panel = document.getElementById('staff-management-panel');
    if (panel) {
        panel.style.display = 'none';
    }
});

// Fire staff
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('fire-btn')) {
        e.stopPropagation();
        const staffId = parseFloat(e.target.dataset.staffId);
        const staffType = e.target.dataset.staffType;
        
        if (confirm(`Are you sure you want to fire this ${staffType}?`)) {
            if (staffType === 'janitor') {
                const index = gameState.janitors.findIndex(j => j.id === staffId);
                if (index !== -1) {
                    gameState.janitors.splice(index, 1);
                }
            } else if (staffType === 'chef') {
                const index = gameState.chefs.findIndex(c => c.id === staffId);
                if (index !== -1) {
                    gameState.chefs.splice(index, 1);
                }
            }
            updateStaffManagementPanel();
        }
    }
});

// Assign staff to floor
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('floor-assign')) {
        const staffId = parseFloat(e.target.dataset.staffId);
        const staffType = e.target.dataset.staffType;
        const floorValue = e.target.value;
        const assignedFloor = floorValue === 'null' ? null : parseInt(floorValue);
        
        if (staffType === 'janitor') {
            const janitor = gameState.janitors.find(j => j.id === staffId);
            if (janitor) {
                janitor.assignedFloor = assignedFloor;
            }
        } else if (staffType === 'chef') {
            const chef = gameState.chefs.find(c => c.id === staffId);
            if (chef) {
                chef.assignedFloor = assignedFloor;
            }
        }
    }
    
    // Assign chef to kitchen
    if (e.target.classList.contains('kitchen-assign')) {
        const staffId = parseFloat(e.target.dataset.staffId);
        const kitchenValue = e.target.value;
        const assignedKitchen = kitchenValue === 'null' ? null : parseFloat(kitchenValue);
        
        const chef = gameState.chefs.find(c => c.id === staffId);
        if (chef) {
            chef.assignedKitchen = assignedKitchen;
        }
    }
});

// Check tutorial progress in game loop (just tracks completion, doesn't auto-advance)
function checkTutorialProgress() {
    if (!gameState.tutorial.active) return;
    
    const step = TUTORIAL_STEPS[gameState.tutorial.currentStep];
    if (step && step.checkComplete && step.checkComplete()) {
        // Mark step as completed (but don't auto-advance - user must click Next)
        if (!gameState.tutorial.completed.includes(gameState.tutorial.currentStep)) {
            gameState.tutorial.completed.push(gameState.tutorial.currentStep);
        }
    }
}

// Save/Load System
function saveGame(slot = null) {
    const saveSlot = slot || gameState.currentSaveSlot;
    const saveData = {
        money: gameState.money,
        day: gameState.day,
        dayStartTime: gameState.dayStartTime,
        review: gameState.review,
        dailyIncome: gameState.dailyIncome,
        lastEventTime: gameState.lastEventTime,
        lastJanitorPay: gameState.lastJanitorPay,
        camera: gameState.camera,
        grid: Array.from(gameState.grid.entries()),
        shops: gameState.shops,
        entrances: gameState.entrances,
        decorations: gameState.decorations,
        utilities: gameState.utilities,
        breakRooms: gameState.breakRooms,
        kitchens: gameState.kitchens,
        chefs: gameState.chefs.map(c => ({
            id: c.id,
            x: c.x,
            y: c.y,
            state: c.state,
            lastCookTime: c.lastCookTime || 0,
            cookingProgress: c.cookingProgress || 0,
            hasFood: c.hasFood || false,
            targetKitchenId: c.targetKitchen ? c.targetKitchen.id : null
        })),
        janitors: gameState.janitors.map(j => ({
            id: j.id,
            x: j.x,
            y: j.y,
            state: j.state,
            breakRoomBoost: j.breakRoomBoost || 0,
            breakRoomBoostStartTime: j.breakRoomBoostStartTime || 0,
            lastBreakTime: j.lastBreakTime || 0,
            assignedFloor: j.assignedFloor,
            name: j.name,
            tasksCompleted: j.tasksCompleted || 0
        })),
        currentFloor: gameState.currentFloor,
        floors: gameState.floors,
        hospitalStaff: gameState.hospitalStaff,
        loyaltyCardHolders: Array.from(gameState.loyaltyCardHolders.entries()),
        tutorial: gameState.tutorial,
        saveTime: Date.now(),
        saveName: `Save Slot ${saveSlot}`
    };
    
    localStorage.setItem(`mallTycoonSave_${saveSlot}`, JSON.stringify(saveData));
    updateSaveSlotsUI();
    alert(`Game saved to Slot ${saveSlot}!`);
}

function getSaveSlotInfo(slot) {
    const saveData = localStorage.getItem(`mallTycoonSave_${slot}`);
    if (!saveData) return null;
    try {
        const data = JSON.parse(saveData);
        return {
            exists: true,
            day: data.day || 1,
            money: data.money || 0,
            shops: (data.shops || []).length,
            saveTime: data.saveTime || 0,
            saveName: data.saveName || `Save Slot ${slot}`
        };
    } catch (e) {
        return null;
    }
}

function loadGame(slot = null) {
    const saveSlot = slot || gameState.currentSaveSlot;
    const saveData = localStorage.getItem(`mallTycoonSave_${saveSlot}`);
    if (!saveData) {
        alert(`No save file found in Slot ${saveSlot}!`);
        return;
    }
    
    try {
        const data = JSON.parse(saveData);
        gameState.currentSaveSlot = saveSlot;
        
        gameState.money = data.money || CONFIG.INITIAL_MONEY;
        gameState.day = data.day || 1;
        gameState.dayStartTime = data.dayStartTime || Date.now();
        gameState.review = data.review || 3.0;
        gameState.dailyIncome = data.dailyIncome || 0;
        gameState.lastEventTime = data.lastEventTime || Date.now();
        gameState.lastJanitorPay = data.lastJanitorPay || Date.now();
        gameState.camera = data.camera || { x: 0, y: 0, zoom: 1.5 };
        
        // Restore grid
        gameState.grid = new Map(data.grid || []);
        
        // Restore shops
        gameState.shops = data.shops || [];
        gameState.shops.forEach(shop => {
            shop.customers = 0; // Reset customer count
            shop.maxCapacity = CONFIG.MAX_SHOP_CAPACITY;
        });
        
        // Restore entrances
        gameState.entrances = data.entrances || [];
        
        // Restore utilities
        gameState.utilities = data.utilities || [];
        
        // Restore break rooms
        gameState.breakRooms = data.breakRooms || [];
        
        // Restore kitchens
        gameState.kitchens = data.kitchens || [];
        
        // Restore chefs
        gameState.chefs = (data.chefs || []).map(c => {
            const chef = {
                id: c.id,
                x: c.x,
                y: c.y,
                targetKitchen: null,
                targetCustomer: null,
                cookingProgress: c.cookingProgress || 0,
                lastCookTime: c.lastCookTime || 0,
                state: c.state || 'idle',
                path: [],
                pathIndex: 0,
                targetX: c.x,
                targetY: c.y,
                hasFood: c.hasFood || false,
                assignedFloor: c.assignedFloor !== undefined ? c.assignedFloor : null,
                assignedKitchen: c.assignedKitchen !== undefined ? c.assignedKitchen : null,
                name: c.name || `Chef ${gameState.chefs.length + 1}`,
                mealsCooked: c.mealsCooked || 0
            };
            
            // Restore targetKitchen reference if chef was cooking or going to kitchen
            if (c.targetKitchenId && (chef.state === 'cooking' || chef.state === 'going-to-kitchen')) {
                chef.targetKitchen = gameState.kitchens.find(k => k.id === c.targetKitchenId);
            }
            
            return chef;
        });
        
        // Restore decorations
        gameState.decorations = data.decorations || [];
        gameState.decorations.forEach(dec => {
            if (dec.type === 'decoration-trashbin') {
                dec.maxCapacity = CONFIG.TRASH_BIN_CAPACITY;
                dec.trashLevel = dec.trashLevel || 0;
                dec.beingEmptied = false;
            }
            if (dec.isBench) {
                dec.customersUsing = 0;
                // Restore seat positions if missing
                if (!dec.seatPositions || dec.seatPositions.length === 0) {
                    dec.seatPositions = [
                        { x: 0.3, y: 0.5, occupied: false },
                        { x: 0.7, y: 0.5, occupied: false }
                    ];
                } else {
                    // Reset occupied status
                    dec.seatPositions.forEach(seat => seat.occupied = false);
                }
            }
        });
        
        // Restore janitors
        gameState.janitors = (data.janitors || []).map(j => ({
            id: j.id,
            x: j.x,
            y: j.y,
            targetSpill: null,
            targetTrashBin: null,
            targetType: null,
            cleaningProgress: 0,
            state: j.state || 'idle',
            path: [],
            pathIndex: 0,
            targetX: j.x,
            targetY: j.y,
            breakRoomBoost: j.breakRoomBoost || 0,
            breakRoomBoostStartTime: j.breakRoomBoostStartTime || 0,
            lastBreakTime: j.lastBreakTime || 0,
            targetBreakRoom: null,
            targetBreakRoomItem: null,
            restTimer: 0,
            restTime: 0,
            assignedFloor: j.assignedFloor !== undefined ? j.assignedFloor : null,
            name: j.name || `Janitor ${gameState.janitors.length + 1}`,
            tasksCompleted: j.tasksCompleted || 0
        }));
        
        // Restore other state
        gameState.currentFloor = data.currentFloor || 0;
        gameState.floors = data.floors || [0];
        gameState.hospitalStaff = data.hospitalStaff || [];
        gameState.loyaltyCardHolders = new Map(data.loyaltyCardHolders || []);
        gameState.tutorial = data.tutorial || { active: true, currentStep: 0, completed: [] };
        
        // Clear customers and spills (they don't persist)
        gameState.customers = [];
        gameState.spills = [];
        gameState.events = [];
        
        updateReview();
        updateShopList();
        updateUI();
        updateSaveSlotsUI();
        alert(`Game loaded from Slot ${saveSlot}!`);
    } catch (e) {
        alert('Error loading save file: ' + e.message);
    }
}


// Mini-map rendering
function renderMiniMap() {
    if (!gameState.miniMapVisible) return;
    
    const miniMapSize = 200;
    const miniMapX = canvas.width - miniMapSize - 10;
    const miniMapY = 10;
    
    // Draw mini-map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    
    // Find bounds of current floor
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const [key, tile] of gameState.grid.entries()) {
        if (tile.floor !== gameState.currentFloor) continue;
        const [x, y] = key.split(',').map(Number);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    
    if (minX === Infinity) {
        // No tiles, draw empty message
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No buildings', miniMapX + miniMapSize / 2, miniMapY + miniMapSize / 2);
        return;
    }
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const scale = Math.min(miniMapSize / width, miniMapSize / height) * 0.9;
    const offsetX = (miniMapSize - width * scale) / 2;
    const offsetY = (miniMapSize - height * scale) / 2;
    
    // Draw tiles
    for (const [key, tile] of gameState.grid.entries()) {
        if (tile.floor !== gameState.currentFloor) continue;
        
        const [x, y] = key.split(',').map(Number);
        const mapX = miniMapX + offsetX + (x - minX) * scale;
        const mapY = miniMapY + offsetY + (y - minY) * scale;
        
        if (tile.type === 'floor') {
            ctx.fillStyle = '#2a2a2a';
        } else if (tile.type === 'entrance') {
            ctx.fillStyle = '#4a9eff';
        } else if (tile.shop) {
            ctx.fillStyle = tile.shop.color || '#ff6b6b';
        } else if (tile.decoration) {
            ctx.fillStyle = tile.decoration.color || '#555';
        } else if (tile.utility) {
            ctx.fillStyle = '#06ffa5';
        } else {
            ctx.fillStyle = '#555';
        }
        
        ctx.fillRect(mapX, mapY, scale, scale);
    }
    
    // Draw camera viewport
    const viewportWidth = (canvas.width / (CONFIG.GRID_SIZE * gameState.camera.zoom)) * scale;
    const viewportHeight = (canvas.height / (CONFIG.GRID_SIZE * gameState.camera.zoom)) * scale;
    const viewportX = miniMapX + offsetX + ((-gameState.camera.x / (CONFIG.GRID_SIZE * gameState.camera.zoom)) - minX) * scale;
    const viewportY = miniMapY + offsetY + ((-gameState.camera.y / (CONFIG.GRID_SIZE * gameState.camera.zoom)) - minY) * scale;
    
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
    
    // Draw current floor indicator
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Floor ${gameState.currentFloor}`, miniMapX + 5, miniMapY + 15);
}

// Update save slots UI
function updateSaveSlotsUI() {
    const slotsContainer = document.getElementById('save-slots-container');
    if (!slotsContainer) return;
    
    slotsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const slotInfo = getSaveSlotInfo(i);
        const slotDiv = document.createElement('div');
        slotDiv.className = 'save-slot';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-slot-btn';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
            gameState.currentSaveSlot = i;
            saveGame(i);
        };
        
        const loadBtn = document.createElement('button');
        loadBtn.className = 'save-slot-btn';
        loadBtn.textContent = 'Load';
        loadBtn.onclick = () => loadGame(i);
        
        const header = document.createElement('div');
        header.className = 'save-slot-header';
        header.innerHTML = `<span>Slot ${i}</span>`;
        header.appendChild(saveBtn);
        header.appendChild(loadBtn);
        
        const info = document.createElement('div');
        info.className = 'save-slot-info';
        if (slotInfo) {
            info.innerHTML = `
                <div>Day: ${slotInfo.day}</div>
                <div>Money: $${slotInfo.money.toLocaleString()}</div>
                <div>Shops: ${slotInfo.shops}</div>
                <div class="save-slot-time">${new Date(slotInfo.saveTime).toLocaleString()}</div>
            `;
        } else {
            info.innerHTML = '<div class="save-slot-empty">Empty</div>';
        }
        
        slotDiv.appendChild(header);
        slotDiv.appendChild(info);
        slotsContainer.appendChild(slotDiv);
    }
}

// Initialize review system
updateReview();


// Mini-map toggle
document.getElementById('minimap-toggle')?.addEventListener('click', () => {
    gameState.miniMapVisible = !gameState.miniMapVisible;
    const btn = document.getElementById('minimap-toggle');
    if (btn) {
        btn.textContent = gameState.miniMapVisible ? 'Hide Mini-map (M)' : 'Toggle Mini-map (M)';
    }
});

// Keyboard shortcut for mini-map (M key)
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const target = e.target;
        // Only toggle if not typing in an input
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            gameState.miniMapVisible = !gameState.miniMapVisible;
            const btn = document.getElementById('minimap-toggle');
            if (btn) {
                btn.textContent = gameState.miniMapVisible ? 'Hide Mini-map (M)' : 'Toggle Mini-map (M)';
            }
        }
    }
});

// Initialize UI on load
updateSaveSlotsUI();

// Start game
// Initialize tutorial on first load
if (gameState.tutorial.active) {
    setTimeout(() => {
        showTutorial();
    }, 500);
}

gameLoop();

