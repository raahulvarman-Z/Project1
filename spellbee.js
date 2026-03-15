const BASE_WORD_BANK = [
    { word: 'honey', clue: 'A sweet food made by bees.', sentence: 'The toast tasted better with a layer of honey on top.', category: 'Nature' },
    { word: 'lantern', clue: 'A portable light with a protective case around it.', sentence: 'We carried a lantern while walking through the campsite.', category: 'Objects' },
    { word: 'journey', clue: 'Travel from one place to another.', sentence: 'Their journey across the hills took all afternoon.', category: 'Adventure' },
    { word: 'cushion', clue: 'A soft pillow used for comfort on a chair or sofa.', sentence: 'The cat curled up on the blue cushion by the window.', category: 'Home' },
    { word: 'whistle', clue: 'A clear, high sound made by the mouth or a small tool.', sentence: 'The referee blew the whistle to begin the match.', category: 'Sound' },
    { word: 'calendar', clue: 'A chart or book that shows days, weeks, and months.', sentence: 'She circled the holiday date on the kitchen calendar.', category: 'Daily Life' },
    { word: 'mountain', clue: 'A landform that rises steeply above the surrounding area.', sentence: 'Snow still covered the top of the mountain in spring.', category: 'Geography' },
    { word: 'brilliant', clue: 'Very bright or exceptionally clever.', sentence: 'The scientist had a brilliant idea during the meeting.', category: 'Vocabulary' },
    { word: 'orchard', clue: 'Land where fruit trees are grown.', sentence: 'We picked ripe apples in the orchard behind the barn.', category: 'Nature' },
    { word: 'gravity', clue: 'The force that pulls objects toward Earth.', sentence: 'Gravity kept the ball from floating into the sky.', category: 'Science' },
    { word: 'festival', clue: 'A time of celebration with events or performances.', sentence: 'The city festival filled the streets with music and lights.', category: 'Culture' },
    { word: 'capture', clue: 'To catch or take control of something.', sentence: 'She tried to capture the butterfly in a small jar.', category: 'Action' },
    { word: 'fragile', clue: 'Easily broken or damaged.', sentence: 'Please handle the fragile vase with both hands.', category: 'Vocabulary' },
    { word: 'compass', clue: 'A tool used to show direction.', sentence: 'The compass needle pointed north all afternoon.', category: 'Adventure' },
    { word: 'balance', clue: 'To remain steady without falling.', sentence: 'He used his arms to balance on the narrow beam.', category: 'Action' },
    { word: 'gallery', clue: 'A place where art is displayed.', sentence: 'The gallery featured paintings from local students.', category: 'Culture' },
    { word: 'delicate', clue: 'Fine, light, or easily damaged.', sentence: 'The baker placed the delicate pastry on a silver plate.', category: 'Vocabulary' },
    { word: 'horizon', clue: 'The line where the earth or sea seems to meet the sky.', sentence: 'The sun dipped below the horizon at the end of the day.', category: 'Geography' },
    { word: 'library', clue: 'A place where books are stored and borrowed.', sentence: 'She spent the afternoon studying in the quiet library.', category: 'Places' },
    { word: 'shelter', clue: 'A safe place that gives protection from danger or weather.', sentence: 'The hikers found shelter under a rocky ledge.', category: 'Safety' },
    { word: 'blanket', clue: 'A warm covering used on a bed or around the body.', sentence: 'He wrapped the blanket around his shoulders.', category: 'Home' },
    { word: 'thunder', clue: 'The loud sound heard after a flash of lightning.', sentence: 'Thunder rumbled across the valley before the rain arrived.', category: 'Weather' },
    { word: 'meadow', clue: 'An open field filled with grass and often wildflowers.', sentence: 'Butterflies floated above the meadow in the afternoon sun.', category: 'Nature' },
    { word: 'triangle', clue: 'A shape with three straight sides.', sentence: 'The child drew a triangle beside the square.', category: 'Math' },
    { word: 'marvelous', clue: 'Extremely good or wonderful.', sentence: 'The chef prepared a marvelous dinner for the guests.', category: 'Vocabulary' },
    { word: 'curious', clue: 'Eager to know or learn something.', sentence: 'The curious student stayed after class to ask more questions.', category: 'Feelings' },
    { word: 'backpack', clue: 'A bag carried on the back with shoulder straps.', sentence: 'She packed her notebook inside the backpack before school.', category: 'Objects' },
    { word: 'glacier', clue: 'A large mass of slow-moving ice.', sentence: 'The guide explained how the glacier carved the valley.', category: 'Geography' },
    { word: 'harvest', clue: 'The time or act of gathering crops.', sentence: 'Farmers celebrated the harvest after months of work.', category: 'Agriculture' },
    { word: 'chimney', clue: 'A vertical passage that carries smoke from a fire out of a building.', sentence: 'Smoke curled gently from the chimney on the cold morning.', category: 'Home' },
    { word: 'sparkle', clue: 'To shine with quick flashes of light.', sentence: 'Fresh snow began to sparkle under the streetlamp.', category: 'Action' },
    { word: 'stadium', clue: 'A large sports arena for games and events.', sentence: 'The crowd filled the stadium before kickoff.', category: 'Places' },
    { word: 'weather', clue: 'The condition of the air outdoors at a given time.', sentence: 'The weather turned cool just before sunset.', category: 'Weather' },
    { word: 'volcano', clue: 'A mountain that can erupt with lava and ash.', sentence: 'The documentary showed smoke rising from the volcano.', category: 'Science' },
    { word: 'diamond', clue: 'A clear, extremely hard gemstone.', sentence: 'The museum displayed a famous diamond behind glass.', category: 'Objects' },
    { word: 'peppermint', clue: 'A strong mint flavor often used in candy or tea.', sentence: 'She chose peppermint tea after dinner.', category: 'Food' },
    { word: 'engineer', clue: 'A person who designs or builds machines, systems, or structures.', sentence: 'The engineer reviewed the bridge plans one last time.', category: 'Careers' },
    { word: 'wildlife', clue: 'Animals living in nature rather than with people.', sentence: 'The park protects local wildlife and their habitats.', category: 'Nature' },
    { word: 'parachute', clue: 'A device that slows a fall through the air.', sentence: 'The skydiver checked the parachute before boarding the plane.', category: 'Adventure' },
    { word: 'notebook', clue: 'A book of blank pages used for writing notes.', sentence: 'He wrote the new idea in his notebook.', category: 'School' },
    { word: 'lighthouse', clue: 'A tower with a bright light that guides ships.', sentence: 'The lighthouse shone across the water all night.', category: 'Places' },
    { word: 'midnight', clue: 'Twelve o clock at night.', sentence: 'The fireworks began just before midnight.', category: 'Time' },
    { word: 'sunflower', clue: 'A tall plant with a large yellow bloom.', sentence: 'The sunflower turned toward the morning light.', category: 'Nature' },
    { word: 'sandwich', clue: 'Food made by placing filling between slices of bread.', sentence: 'He packed a sandwich for the train ride.', category: 'Food' },
    { word: 'telescope', clue: 'An instrument used to view faraway objects in space or on land.', sentence: 'The astronomer adjusted the telescope carefully.', category: 'Science' }
];

const EXTRA_WORD_GROUPS = [
    {
        category: 'Nature',
        words: [
            'acorn', 'alder', 'amber', 'anemone', 'bark', 'blossom', 'bluebell', 'briar', 'cactus', 'camellia',
            'canopy', 'chestnut', 'clover', 'coral', 'crocus', 'daisy', 'dandelion', 'elm', 'fern', 'foliage',
            'forest', 'foxglove', 'gardenia', 'hazel', 'heather', 'hibiscus', 'holly', 'ivy', 'jasmine', 'juniper',
            'lavender', 'lilac', 'lily', 'magnolia', 'maple', 'moss', 'myrtle', 'nettle', 'orchid', 'palm',
            'petal', 'pinecone', 'pollen', 'reed', 'rosemary', 'sapling', 'thistle', 'tulip', 'willow', 'yarrow'
        ]
    },
    {
        category: 'Geography',
        words: [
            'arroyo', 'avalanche', 'badlands', 'basin', 'boulder', 'breeze', 'brook', 'canyon', 'cavern', 'cliff',
            'cloudburst', 'coastline', 'creek', 'current', 'cyclone', 'delta', 'desert', 'downpour', 'drizzle', 'dune',
            'earthquake', 'estuary', 'fjord', 'geyser', 'gully', 'hailstorm', 'harbor', 'iceberg', 'island', 'lagoon',
            'landslide', 'monsoon', 'oasis', 'ocean', 'peninsula', 'prairie', 'puddle', 'rainbow', 'rainfall', 'riverbank',
            'shoreline', 'squall', 'stream', 'tide', 'tornado', 'valley', 'waterfall', 'whirlwind', 'wetlands', 'watershed'
        ]
    },
    {
        category: 'Animals',
        words: [
            'badger', 'beaver', 'bison', 'bobcat', 'buffalo', 'camel', 'caribou', 'cheetah', 'cougar', 'coyote',
            'dolphin', 'donkey', 'falcon', 'ferret', 'flamingo', 'gazelle', 'giraffe', 'gorilla', 'hamster', 'hedgehog',
            'heron', 'jaguar', 'kangaroo', 'koala', 'lemur', 'leopard', 'lobster', 'meerkat', 'mongoose', 'narwhal',
            'octopus', 'opossum', 'otter', 'panther', 'penguin', 'porcupine', 'rabbit', 'raccoon', 'reindeer', 'salamander',
            'scorpion', 'seahorse', 'sparrow', 'squirrel', 'stallion', 'termite', 'walrus', 'weasel', 'woodpecker', 'zebra'
        ]
    },
    {
        category: 'Wildlife',
        words: [
            'albatross', 'beetle', 'bluejay', 'butterfly', 'canary', 'cardinal', 'catfish', 'centipede', 'chipmunk', 'crab',
            'crane', 'cricket', 'dragonfly', 'eagle', 'firefly', 'goldfish', 'grasshopper', 'jellyfish', 'kingfisher', 'ladybug',
            'lark', 'mackerel', 'manatee', 'minnow', 'mockingbird', 'moth', 'pelican', 'perch', 'pigeon', 'piranha',
            'platypus', 'raven', 'robin', 'sardine', 'seagull', 'shrimp', 'starfish', 'stingray', 'swallow', 'swordfish',
            'tadpole', 'tarantula', 'trout', 'tuna', 'turkey', 'turtle', 'vulture', 'wasp', 'whale', 'wren'
        ]
    },
    {
        category: 'Objects',
        words: [
            'armchair', 'basket', 'blender', 'bookshelf', 'broomstick', 'bucket', 'candle', 'carpet', 'charger', 'curtain',
            'doormat', 'drawer', 'faucet', 'flashlight', 'freezer', 'hanger', 'jar', 'kettle', 'ladle', 'lampshade',
            'mirror', 'napkin', 'pantry', 'pillowcase', 'pitcher', 'plank', 'platter', 'pocketknife', 'quilt', 'radio',
            'saucepan', 'scissors', 'shelf', 'shovel', 'skillet', 'sponge', 'stapler', 'stool', 'suitcase', 'teacup',
            'toothbrush', 'toolbox', 'towel', 'tray', 'umbrella', 'vacuum', 'wallet', 'wheelbarrow', 'windowpane', 'zipper'
        ]
    },
    {
        category: 'Gear',
        words: [
            'apron', 'bandana', 'boots', 'bracelet', 'button', 'cardigan', 'chisel', 'drill', 'earmuffs', 'goggles',
            'hammer', 'helmet', 'jacket', 'jeans', 'kerchief', 'ladder', 'locket', 'mallet', 'necklace', 'overcoat',
            'paintbrush', 'pajamas', 'poncho', 'pulley', 'raincoat', 'ribbon', 'saddle', 'sandal', 'scarf', 'screwdriver',
            'shoelace', 'slippers', 'sneakers', 'socket', 'spool', 'sweater', 'thimble', 'torch', 'trousers', 'tunic',
            'vest', 'wagon', 'wrench', 'yarn', 'anvil', 'binoculars', 'clipboard', 'crowbar', 'needle', 'pliers'
        ]
    },
    {
        category: 'Actions',
        words: [
            'amble', 'ascend', 'bounce', 'climb', 'crawl', 'dash', 'dart', 'drift', 'gallop', 'glide',
            'grab', 'hike', 'hop', 'hurry', 'jolt', 'jog', 'jump', 'kneel', 'leap', 'lunge',
            'march', 'meander', 'pedal', 'pounce', 'prance', 'race', 'ramble', 'roam', 'rush', 'saunter',
            'scamper', 'scoot', 'shuffle', 'sidestep', 'skitter', 'skip', 'slide', 'sprint', 'stagger', 'stomp',
            'stretch', 'stride', 'stroll', 'swagger', 'swing', 'tiptoe', 'toddle', 'tumble', 'wander', 'zigzag'
        ]
    },
    {
        category: 'Thinking',
        words: [
            'admire', 'analyze', 'answer', 'arrange', 'believe', 'calculate', 'chatter', 'choose', 'compare', 'consider',
            'create', 'decide', 'describe', 'discover', 'discuss', 'explain', 'explore', 'imagine', 'invent', 'listen',
            'memorize', 'notice', 'observe', 'organize', 'ponder', 'practice', 'predict', 'question', 'recall', 'reflect',
            'remember', 'reply', 'research', 'revise', 'search', 'solve', 'spell', 'study', 'summarize', 'suppose',
            'teach', 'think', 'translate', 'understand', 'whisper', 'wonder', 'write', 'announce', 'compose', 'examine'
        ]
    },
    {
        category: 'Places',
        words: [
            'airport', 'aquarium', 'attic', 'bakery', 'balcony', 'barn', 'basement', 'boulevard', 'bridge', 'cabin',
            'campsite', 'castle', 'cathedral', 'classroom', 'courthouse', 'dockyard', 'embassy', 'factory', 'farmhouse', 'fountain',
            'garage', 'greenhouse', 'hospital', 'inn', 'kitchen', 'laboratory', 'mansion', 'marketplace', 'museum', 'observatory',
            'office', 'palace', 'playground', 'plaza', 'porch', 'railway', 'ranch', 'restaurant', 'schoolhouse', 'skyscraper',
            'subway', 'theater', 'tower', 'tunnel', 'university', 'village', 'warehouse', 'workshop', 'zoo', 'motel'
        ]
    },
    {
        category: 'Adventure',
        words: [
            'adventure', 'anchor', 'baggage', 'campfire', 'captain', 'caravan', 'detour', 'expedition', 'explorer', 'frontier',
            'gateway', 'guidebook', 'itinerary', 'kayak', 'landmark', 'luggage', 'mariner', 'navigator', 'outpost', 'passage',
            'passport', 'pathway', 'pioneer', 'portside', 'quest', 'ranger', 'route', 'sailor', 'seaport', 'shortcut',
            'sightseeing', 'signpost', 'starboard', 'summit', 'trailhead', 'transit', 'traveler', 'trek', 'voyage', 'waypoint',
            'wilderness', 'windward', 'crosswind', 'lifeboat', 'mooring', 'roadtrip', 'stopover', 'backpacker', 'ferryboat', 'headlamp'
        ]
    },
    {
        category: 'Science',
        words: [
            'asteroid', 'astronaut', 'atmosphere', 'atom', 'aurora', 'comet', 'constellation', 'cosmos', 'crater', 'eclipse',
            'electron', 'energy', 'galaxy', 'hydrogen', 'inertia', 'meteor', 'molecule', 'nebula', 'neutron', 'nucleus',
            'orbit', 'oxygen', 'photon', 'planet', 'plasma', 'proton', 'quasar', 'radiation', 'rocket', 'satellite',
            'solar', 'spectrum', 'starlight', 'starship', 'theory', 'vacuum', 'velocity', 'voltage', 'wormhole', 'zenith',
            'biosphere', 'chemistry', 'ecology', 'fusion', 'geology', 'magnetism', 'mineral', 'physics', 'reactor', 'seismology'
        ]
    },
    {
        category: 'STEM',
        words: [
            'abacus', 'algorithm', 'algebra', 'anatomy', 'bacteria', 'calculus', 'catalyst', 'circuit', 'climate', 'crystal',
            'decimal', 'density', 'equation', 'experiment', 'fossil', 'fraction', 'friction', 'fungus', 'geometry', 'graphite',
            'habitat', 'integer', 'isotope', 'kinetic', 'latitude', 'longitude', 'logic', 'machine', 'microscope', 'momentum',
            'numeral', 'particle', 'pattern', 'polygon', 'pressure', 'prism', 'quantum', 'radius', 'robot', 'scalar',
            'signal', 'silicon', 'skeleton', 'software', 'solvent', 'statistic', 'surface', 'symmetry', 'tissue', 'variable'
        ]
    },
    {
        category: 'Food',
        words: [
            'almond', 'apple', 'apricot', 'artichoke', 'asparagus', 'avocado', 'banana', 'beetroot', 'blackberry', 'blueberry',
            'broccoli', 'cabbage', 'cantaloupe', 'carrot', 'cashew', 'cauliflower', 'celery', 'cherry', 'coconut', 'cranberry',
            'cucumber', 'date', 'eggplant', 'fig', 'garlic', 'grapefruit', 'grape', 'guava', 'hazelnut', 'kiwi',
            'lemon', 'lettuce', 'lime', 'mango', 'melon', 'nectarine', 'olive', 'onion', 'orange', 'papaya',
            'peach', 'peanut', 'pear', 'pecan', 'pepper', 'pineapple', 'pistachio', 'plum', 'pomegranate', 'radish'
        ]
    },
    {
        category: 'Cooking',
        words: [
            'biscuit', 'brownie', 'burrito', 'casserole', 'cereal', 'cheesecake', 'chocolate', 'cinnamon', 'cookie', 'cracker',
            'croissant', 'cupcake', 'custard', 'dumpling', 'gingerbread', 'granola', 'hamburger', 'lasagna', 'macaroni', 'marinade',
            'meatball', 'muffin', 'noodle', 'omelet', 'pancake', 'pastry', 'pickle', 'popcorn', 'pretzel', 'pudding',
            'ravioli', 'sausage', 'sherbet', 'spaghetti', 'sprinkle', 'stew', 'syrup', 'taco', 'tamale', 'tortilla',
            'vanilla', 'waffle', 'yogurt', 'zucchini', 'chutney', 'curry', 'risotto', 'bagel', 'kebab', 'souffle'
        ]
    },
    {
        category: 'School',
        words: [
            'alphabet', 'archive', 'atlas', 'binder', 'calculator', 'chapter', 'chalkboard', 'composition', 'crayon', 'dictionary',
            'easel', 'encyclopedia', 'grammar', 'highlighter', 'homework', 'index', 'journal', 'lecture', 'lesson', 'marker',
            'paragraph', 'pencil', 'penmanship', 'planner', 'poetry', 'projector', 'question', 'quotation', 'reader', 'recess',
            'ruler', 'schedule', 'scholarship', 'sentence', 'spelling', 'syllabus', 'textbook', 'thesaurus', 'tutorial', 'vocabulary',
            'workbook', 'worksheet', 'yearbook', 'blackboard', 'eraser', 'essay', 'literature', 'report', 'semester', 'subject'
        ]
    },
    {
        category: 'Arts',
        words: [
            'anthem', 'ballet', 'ballad', 'canvas', 'cartoon', 'cello', 'chorus', 'cinema', 'clarinet', 'costume',
            'drama', 'drawing', 'duet', 'flute', 'guitar', 'harmony', 'keyboard', 'lyric', 'melody', 'mosaic',
            'mural', 'opera', 'orchestra', 'painting', 'palette', 'portrait', 'rhythm', 'sculpture', 'sketch', 'sonnet',
            'stagecraft', 'studio', 'trumpet', 'violin', 'watercolor', 'accordion', 'banjo', 'cabaret', 'folklore', 'novelist',
            'pageant', 'pottery', 'puppet', 'storyteller', 'tambourine', 'comedian', 'illustrator', 'playwright', 'recital', 'screenplay'
        ]
    },
    {
        category: 'Time',
        words: [
            'afternoon', 'ancient', 'anniversary', 'autumn', 'century', 'dawn', 'daylight', 'decade', 'dusk', 'evening',
            'february', 'friday', 'future', 'january', 'july', 'june', 'lifetime', 'monday', 'monthly', 'morning',
            'nightfall', 'november', 'october', 'past', 'present', 'saturday', 'season', 'second', 'september', 'spring',
            'summer', 'sunday', 'thursday', 'timeline', 'today', 'tomorrow', 'tuesday', 'twilight', 'vacation', 'weekday',
            'weekend', 'winter', 'yearly', 'yesterday', 'sunrise', 'sunset', 'forecast', 'frost', 'solstice', 'equinox'
        ]
    },
    {
        category: 'Feelings',
        words: [
            'active', 'adventurous', 'ambitious', 'anxious', 'brave', 'calm', 'cheerful', 'clever', 'confident', 'considerate',
            'courageous', 'creative', 'daring', 'determined', 'eager', 'friendly', 'gentle', 'grateful', 'honest', 'hopeful',
            'humble', 'jolly', 'joyful', 'kind', 'lively', 'loyal', 'merry', 'modest', 'nervous', 'patient',
            'polite', 'proud', 'quiet', 'radiant', 'resourceful', 'respectful', 'serious', 'shy', 'sincere', 'skillful',
            'thoughtful', 'tidy', 'trustful', 'upbeat', 'vibrant', 'wise', 'witty', 'worthy', 'youthful', 'fearless'
        ]
    },
    {
        category: 'Careers',
        words: [
            'architect', 'artist', 'baker', 'builder', 'caretaker', 'carpenter', 'cashier', 'chef', 'coach', 'dentist',
            'designer', 'doctor', 'driver', 'farmer', 'firefighter', 'gardener', 'journalist', 'judge', 'lawyer', 'librarian',
            'mechanic', 'musician', 'nurse', 'painter', 'paramedic', 'pharmacist', 'photographer', 'pilot', 'plumber', 'poet',
            'police', 'principal', 'professor', 'reporter', 'scientist', 'singer', 'surgeon', 'tailor', 'teacher', 'vendor',
            'veterinarian', 'waiter', 'welder', 'writer', 'detective', 'electrician', 'grocer', 'manager', 'banker', 'curator'
        ]
    },
    {
        category: 'Sports',
        words: [
            'archery', 'badminton', 'baseball', 'basketball', 'bowling', 'boxing', 'checkers', 'chess', 'croquet', 'cycling',
            'fencing', 'football', 'golf', 'gymnastics', 'hockey', 'karate', 'marathon', 'netball', 'paddling', 'polo',
            'racing', 'rowing', 'rugby', 'skating', 'skiing', 'soccer', 'softball', 'sprinting', 'surfing', 'swimming',
            'tennis', 'volleyball', 'wrestling', 'yoga', 'bocce', 'canoeing', 'darts', 'diving', 'handball', 'kickball',
            'lacrosse', 'obstacle', 'relay', 'rodeo', 'sprint', 'triathlon', 'weightlifting', 'billiards', 'javelin', 'taekwondo'
        ]
    }
];

const CATEGORY_CLUES = {
    Nature: 'A plant, tree, flower, or other natural thing found outdoors.',
    Geography: 'A landform, weather event, or water feature found in the natural world.',
    Animals: 'An animal that may live on land, in trees, or around people.',
    Wildlife: 'A wild creature such as a bird, fish, insect, or sea animal.',
    Objects: 'An everyday object used at home, at school, or on the go.',
    Gear: 'A piece of clothing, equipment, or a useful tool.',
    Actions: 'A word that describes a kind of movement or motion.',
    Thinking: 'A word connected to learning, speaking, solving, or using the mind.',
    Places: 'A place, building, or location people visit, work in, or live near.',
    Adventure: 'A travel or exploration word linked to trips, routes, or discovery.',
    Science: 'A science word connected to space, energy, matter, or the Earth.',
    STEM: 'A STEM word used in math, science, technology, or measurement.',
    Food: 'A fruit, vegetable, nut, or ingredient people eat.',
    Cooking: 'A meal, snack, or kitchen word related to cooking or baking.',
    School: 'A word commonly used in school, reading, writing, or studying.',
    Arts: 'A music, art, theater, or storytelling word.',
    Time: 'A word related to dates, seasons, parts of the day, or passing time.',
    Feelings: 'A word that describes a feeling, mood, or personal quality.',
    Careers: 'A job, profession, or kind of work people do.',
    Sports: 'A sport, game, or athletic activity people play or watch.'
};

const WORD_CLUE_OVERRIDES = {
    adventure: 'An exciting and sometimes risky experience.',
    anchor: 'A heavy device dropped to keep a boat from drifting.',
    baggage: 'Bags and suitcases carried while traveling.',
    campfire: 'An outdoor fire used for warmth or cooking at a campsite.',
    captain: 'The person in charge of a ship or a team.',
    caravan: 'A group of travelers or vehicles moving together.',
    detour: 'A different route taken to avoid the usual path.',
    expedition: 'A journey made for exploration or a special purpose.',
    explorer: 'A person who travels to discover or learn about new places.',
    frontier: 'The far edge of settled land or a region being explored.',
    gateway: 'An entrance or way into a place.',
    guidebook: 'A book that gives travelers information about places to visit.',
    itinerary: 'A plan or schedule for a trip.',
    kayak: 'A small narrow boat moved with a paddle.',
    landmark: 'A well-known feature that helps people recognize a place.',
    luggage: 'Suitcases and bags packed for travel.',
    mariner: 'A person who works or travels at sea.',
    navigator: 'A person who plans or directs the course of a journey.',
    outpost: 'A small camp or station far from a main base.',
    passage: 'A route or trip from one place to another.',
    passport: 'An official document used for international travel.',
    pathway: 'A way or track for walking from one place to another.',
    pioneer: 'One of the first people to explore or settle an area.',
    portside: 'The left side of a ship when facing forward.',
    quest: 'A long search or journey for something important.',
    ranger: 'A person who protects and watches over a park or forest.',
    route: 'A way or course taken to reach a place.',
    sailor: 'A person who works on or travels by ship.',
    seaport: 'A town or city with a harbor where ships arrive.',
    shortcut: 'A quicker or shorter way to get somewhere.',
    sightseeing: 'The activity of visiting famous or interesting places.',
    signpost: 'A post with signs that show directions.',
    starboard: 'The right side of a ship when facing forward.',
    summit: 'The highest point of a hill or mountain.',
    trailhead: 'The place where a hiking trail begins.',
    transit: 'The movement or system of carrying people from place to place.',
    traveler: 'A person who goes from one place to another.',
    trek: 'A long and often difficult journey, especially on foot.',
    voyage: 'A long trip, especially by sea.',
    waypoint: 'A marked point on a route used for navigation.',
    wilderness: 'A wild natural area with little human development.',
    windward: 'The side facing the wind.',
    crosswind: 'A wind blowing across the direction of travel.',
    lifeboat: 'A small boat used to escape danger at sea.',
    mooring: 'A place or line used to secure a boat.',
    roadtrip: 'A journey made mainly by car over a long distance.',
    stopover: 'A short stay between parts of a longer trip.',
    backpacker: 'A traveler carrying supplies in a backpack.',
    ferryboat: 'A boat that carries people or vehicles across water.',
    headlamp: 'A light worn on the head or fixed to the front of a vehicle.'
};

function buildExtraWordBank(groups) {
    return groups.flatMap(({ category, words }) =>
        words.map((word) => ({
            word,
            clue: WORD_CLUE_OVERRIDES[word] || CATEGORY_CLUES[category] || `A word from the ${category.toLowerCase()} category.`,
            sentence: `Use the pronunciation and the ${category.toLowerCase()} category to spell this word.`,
            category
        }))
    );
}

const EXTRA_WORD_BANK = buildExtraWordBank(EXTRA_WORD_GROUPS);
const WORD_BANK = [...BASE_WORD_BANK, ...EXTRA_WORD_BANK];

const STORAGE_KEY = 'spellBeeBestScore';
const RECENT_WORD_LIMIT = 10;

const scoreEl = document.getElementById('score-val');
const bestEl = document.getElementById('best-val');
const streakEl = document.getElementById('streak-val');
const roundEl = document.getElementById('round-val');
const livesEl = document.getElementById('lives-val');
const categoryEl = document.getElementById('category-val');
const clueEl = document.getElementById('clue-text');
const statusEl = document.getElementById('status-msg');
const answerInput = document.getElementById('answer-input');
const historyList = document.getElementById('history-list');
const endModal = document.getElementById('end-modal');
const endTitle = document.getElementById('end-title');
const endSummary = document.getElementById('end-summary');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');

const answerForm = document.getElementById('answer-form');
const speakBtn = document.getElementById('speak-btn');
const skipBtn = document.getElementById('skip-btn');
const restartBtn = document.getElementById('restart-btn');
const playAgainBtn = document.getElementById('play-again-btn');

let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let gameState = null;
let advanceTimer = null;

bestEl.textContent = String(bestScore);

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function getNextWord(recentWords) {
    const recentSet = new Set(recentWords);
    const availableWords = WORD_BANK.filter((entry) => !recentSet.has(entry.word));
    const nextWord = randomItem(availableWords.length ? availableWords : WORD_BANK);

    recentWords.push(nextWord.word);
    if (recentWords.length > RECENT_WORD_LIMIT) {
        recentWords.shift();
    }

    return nextWord;
}

function speakWord(word) {
    if (!('speechSynthesis' in window)) {
        setStatus('Speech is not available in this browser. Use the clue instead.', 'error');
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.82;
    utterance.pitch = 1.02;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function setStatus(message, tone = '') {
    statusEl.textContent = message;
    statusEl.className = 'status-msg';
    if (tone) {
        statusEl.classList.add(tone);
    }
}

function renderHistory() {
    if (!gameState.history.length) {
        historyList.innerHTML = '<p class="history-empty">No words answered yet.</p>';
        return;
    }

    historyList.innerHTML = gameState.history
        .slice(-8)
        .reverse()
        .map((entry) => {
            const stateClass = entry.correct ? 'correct' : 'wrong';
            const stateText = entry.correct ? 'Correct' : 'Missed';
            return `
                <div class="history-item">
                    <div>
                        <p class="history-word">${entry.word}</p>
                        <p>${entry.category}</p>
                    </div>
                    <span class="history-state ${stateClass}">${stateText}</span>
                </div>
            `;
        })
        .join('');
}

function updateHud() {
    scoreEl.textContent = String(gameState.score);
    bestEl.textContent = String(bestScore);
    streakEl.textContent = String(gameState.streak);
    roundEl.textContent = String(gameState.round);
    livesEl.textContent = String(gameState.lives);
}

function renderRound() {
    const current = gameState.currentWord;
    categoryEl.textContent = current.category;
    clueEl.textContent = current.clue;
    answerInput.value = '';
    answerInput.disabled = false;
    speakBtn.disabled = false;
    skipBtn.disabled = false;
    setStatus('Press Hear Word to listen, then type your spelling.');
    updateHud();
    renderHistory();
    answerInput.focus();
}

function saveBestScore() {
    if (gameState.score > bestScore) {
        bestScore = gameState.score;
        localStorage.setItem(STORAGE_KEY, String(bestScore));
    }
}

function finishGame() {
    clearTimeout(advanceTimer);
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    answerInput.disabled = true;
    speakBtn.disabled = true;
    skipBtn.disabled = true;
    saveBestScore();
    bestEl.textContent = String(bestScore);
    finalScoreEl.textContent = String(gameState.score);
    finalBestEl.textContent = String(bestScore);
    endTitle.textContent = 'Out of lives';
    endSummary.textContent = `You survived ${gameState.round} word${gameState.round === 1 ? '' : 's'}. Restart and keep the streak going longer.`;
    endModal.classList.remove('hidden');
}

function nextRound() {
    clearTimeout(advanceTimer);
    gameState.round += 1;
    gameState.currentWord = getNextWord(gameState.recentWords);
    renderRound();
}

function registerResult(correct, skipped = false) {
    const current = gameState.currentWord;
    gameState.history.push({
        word: current.word,
        category: current.category,
        correct
    });

    if (correct) {
        gameState.streak += 1;
        gameState.score += 10 + (gameState.streak - 1) * 2;
        setStatus(`Correct. "${current.word}" keeps your streak alive.`, 'success');
    } else {
        gameState.lives -= 1;
        gameState.streak = 0;
        const prefix = skipped ? 'Skipped.' : 'Incorrect.';
        setStatus(`${prefix} The correct spelling was "${current.word}".`, 'error');
    }

    updateHud();
    renderHistory();
    answerInput.disabled = true;
    speakBtn.disabled = true;
    skipBtn.disabled = true;

    if (gameState.lives <= 0) {
        advanceTimer = setTimeout(finishGame, 1100);
        return;
    }

    advanceTimer = setTimeout(nextRound, 1200);
}

function startGame() {
    clearTimeout(advanceTimer);
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    endModal.classList.add('hidden');
    gameState = {
        currentWord: null,
        round: 1,
        score: 0,
        streak: 0,
        lives: 3,
        history: [],
        recentWords: []
    };
    gameState.currentWord = getNextWord(gameState.recentWords);
    renderRound();
}

answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!gameState) {
        return;
    }

    const guess = answerInput.value.trim().toLowerCase();
    if (!guess) {
        setStatus('Type your spelling before checking the answer.', 'error');
        return;
    }

    registerResult(guess === gameState.currentWord.word.toLowerCase());
});

speakBtn.addEventListener('click', () => {
    if (!gameState) {
        return;
    }
    speakWord(gameState.currentWord.word);
    setStatus('Pronunciation played. Type the word you heard.');
});

skipBtn.addEventListener('click', () => {
    if (!gameState) {
        return;
    }
    registerResult(false, true);
});

restartBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const isTypingTarget =
        document.activeElement === answerInput ||
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        document.activeElement?.isContentEditable;

    if (event.key.toLowerCase() === 'enter' && document.activeElement === answerInput) {
        return;
    }

    if (isTypingTarget) {
        return;
    }

    if (event.key.toLowerCase() === 'h' && gameState && !speakBtn.disabled) {
        event.preventDefault();
        speakBtn.click();
    }
});

startGame();
