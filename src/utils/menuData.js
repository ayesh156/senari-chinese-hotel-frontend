/**
 * Shared menu data — single source of truth for MenuPage and ProductViewPage.
 * Replace with API call once backend is ready.
 * 22 items — enough to test 8-per-page pagination (3 pages).
 */
export const MENU_ITEMS = [
  // ── Street Food ──────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Chicken Kottu',
    category: 'Street Food',
    price: 850,
    calories: 620,
    prepTime: '15 min',
    isNew: false,
    description:
      'A Sri Lankan street-food classic — shredded roti stir-fried with spiced chicken, egg, vegetables and aromatic curry sauce. Crispy, hearty and utterly addictive.',
    ingredients: ['Roti', 'Chicken', 'Egg', 'Leeks', 'Carrot', 'Curry Sauce', 'Spices'],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 6,
    name: 'Vegetable Kottu',
    category: 'Street Food',
    price: 650,
    calories: 480,
    prepTime: '12 min',
    isNew: false,
    description:
      'The vegetarian take on our signature Kottu — shredded roti stir-fried with seasonal vegetables, egg and a fragrant curry sauce.',
    ingredients: ['Roti', 'Mixed Vegetables', 'Egg', 'Curry Sauce', 'Leeks', 'Spices'],
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 9,
    name: 'Egg Kottu',
    category: 'Street Food',
    price: 700,
    calories: 530,
    prepTime: '12 min',
    isNew: true,
    description:
      'Classic kottu made with double egg and a rich curry sauce. A quick, filling street-food staple loved by all ages.',
    ingredients: ['Roti', 'Egg', 'Leeks', 'Carrot', 'Curry Sauce', 'Spices'],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 10,
    name: 'Cheese Kottu',
    category: 'Street Food',
    price: 950,
    calories: 680,
    prepTime: '15 min',
    isNew: true,
    description:
      'Our indulgent twist on the classic — loaded with melted cheese, chicken and a smoky devilled sauce. A crowd favourite.',
    ingredients: ['Roti', 'Chicken', 'Cheese', 'Egg', 'Devilled Sauce', 'Spices'],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
  },

  // ── Rice Dishes ───────────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Mixed Fried Rice',
    category: 'Rice Dishes',
    price: 750,
    calories: 540,
    prepTime: '12 min',
    isNew: false,
    description:
      'Fragrant basmati rice wok-tossed with mixed vegetables, egg, soy sauce and a hint of sesame oil. A satisfying everyday favourite.',
    ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Egg', 'Soy Sauce', 'Sesame Oil', 'Spring Onion'],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 11,
    name: 'Chicken Fried Rice',
    category: 'Rice Dishes',
    price: 820,
    calories: 580,
    prepTime: '14 min',
    isNew: false,
    description:
      'Wok-tossed basmati rice with tender chicken strips, egg and vegetables in a savoury soy-ginger sauce.',
    ingredients: ['Basmati Rice', 'Chicken', 'Egg', 'Soy Sauce', 'Ginger', 'Spring Onion'],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 12,
    name: 'Prawn Fried Rice',
    category: 'Rice Dishes',
    price: 1050,
    calories: 560,
    prepTime: '16 min',
    isNew: true,
    description:
      'Fragrant rice stir-fried with juicy prawns, egg and vegetables in a light garlic-butter sauce.',
    ingredients: ['Basmati Rice', 'Prawns', 'Egg', 'Garlic', 'Butter', 'Spring Onion'],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 13,
    name: 'Rice & Curry',
    category: 'Rice Dishes',
    price: 680,
    calories: 620,
    prepTime: '10 min',
    isNew: false,
    description:
      'Traditional Sri Lankan rice served with a rotating selection of curries, papadum and pol sambol.',
    ingredients: ['Steamed Rice', 'Dhal Curry', 'Pol Sambol', 'Papadum', 'Seasonal Curries'],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  },

  // ── Noodles ───────────────────────────────────────────────────────────────
  {
    id: 3,
    name: 'Seafood Noodles',
    category: 'Noodles',
    price: 1100,
    calories: 480,
    prepTime: '18 min',
    isNew: true,
    description:
      'Silky egg noodles tossed with fresh prawns, squid and fish in a light garlic-ginger sauce. A coastal Sri Lankan favourite with a modern twist.',
    ingredients: ['Egg Noodles', 'Prawns', 'Squid', 'Fish', 'Garlic', 'Ginger', 'Oyster Sauce'],
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 8,
    name: 'Egg Fried Noodles',
    category: 'Noodles',
    price: 720,
    calories: 510,
    prepTime: '10 min',
    isNew: false,
    description:
      'Classic egg noodles wok-fried with scrambled egg, spring onion and a savoury soy-based sauce. Simple, quick and deeply satisfying.',
    ingredients: ['Egg Noodles', 'Egg', 'Spring Onion', 'Soy Sauce', 'Garlic', 'Sesame Oil'],
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 14,
    name: 'Chicken Noodles',
    category: 'Noodles',
    price: 880,
    calories: 530,
    prepTime: '14 min',
    isNew: false,
    description:
      'Stir-fried egg noodles with tender chicken, capsicum and a savoury oyster-soy sauce. A hearty, flavour-packed bowl.',
    ingredients: ['Egg Noodles', 'Chicken', 'Capsicum', 'Oyster Sauce', 'Soy Sauce', 'Garlic'],
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&auto=format&fit=crop&q=80',
  },

  // ── Mains ─────────────────────────────────────────────────────────────────
  {
    id: 4,
    name: 'Devilled Chicken',
    category: 'Mains',
    price: 950,
    calories: 590,
    prepTime: '20 min',
    isNew: true,
    description:
      'Tender chicken pieces flash-fried with capsicum, onion and a fiery devilled sauce. Bold, spicy and packed with flavour.',
    ingredients: ['Chicken', 'Capsicum', 'Onion', 'Tomato', 'Chilli', 'Devilled Sauce', 'Spices'],
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    name: 'Prawn Curry',
    category: 'Mains',
    price: 1350,
    calories: 420,
    prepTime: '22 min',
    isNew: false,
    description:
      'Plump tiger prawns slow-cooked in a rich coconut milk curry with pandan, lemongrass and roasted spices.',
    ingredients: ['Tiger Prawns', 'Coconut Milk', 'Pandan', 'Lemongrass', 'Tomato', 'Roasted Spices'],
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 15,
    name: 'Fish Ambul Thiyal',
    category: 'Mains',
    price: 1150,
    calories: 380,
    prepTime: '25 min',
    isNew: false,
    description:
      'A bold, tangy dry fish curry made with goraka (gamboge) and a blend of roasted spices. A Southern Sri Lankan speciality.',
    ingredients: ['Tuna', 'Goraka', 'Roasted Spices', 'Pandan', 'Curry Leaves', 'Garlic'],
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 16,
    name: 'Chicken Curry',
    category: 'Mains',
    price: 900,
    calories: 520,
    prepTime: '20 min',
    isNew: false,
    description:
      'Slow-cooked chicken in a rich, aromatic Sri Lankan curry sauce with coconut milk and roasted spices.',
    ingredients: ['Chicken', 'Coconut Milk', 'Roasted Spices', 'Pandan', 'Curry Leaves', 'Tomato'],
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 17,
    name: 'Dhal Curry',
    category: 'Mains',
    price: 480,
    calories: 340,
    prepTime: '15 min',
    isNew: false,
    description:
      'Creamy red lentil curry tempered with mustard seeds, curry leaves and coconut milk. A comforting Sri Lankan staple.',
    ingredients: ['Red Lentils', 'Coconut Milk', 'Mustard Seeds', 'Curry Leaves', 'Turmeric', 'Onion'],
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
  },

  // ── Desserts ──────────────────────────────────────────────────────────────
  {
    id: 7,
    name: 'Watalappan',
    category: 'Desserts',
    price: 380,
    calories: 310,
    prepTime: '5 min',
    isNew: false,
    description:
      'A traditional Sri Lankan steamed coconut custard sweetened with kithul jaggery and perfumed with cardamom and nutmeg.',
    ingredients: ['Coconut Milk', 'Kithul Jaggery', 'Eggs', 'Cardamom', 'Nutmeg', 'Cashews'],
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 18,
    name: 'Curd & Treacle',
    category: 'Desserts',
    price: 320,
    calories: 260,
    prepTime: '3 min',
    isNew: false,
    description:
      'Thick buffalo curd served with golden kithul treacle. A simple, iconic Sri Lankan dessert that never disappoints.',
    ingredients: ['Buffalo Curd', 'Kithul Treacle'],
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 19,
    name: 'Coconut Ice Cream',
    category: 'Desserts',
    price: 420,
    calories: 290,
    prepTime: '3 min',
    isNew: true,
    description:
      'House-made coconut ice cream with a hint of pandan and toasted coconut flakes. Refreshing and tropical.',
    ingredients: ['Coconut Milk', 'Pandan', 'Sugar', 'Toasted Coconut'],
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&auto=format&fit=crop&q=80',
  },

  // ── Beverages ─────────────────────────────────────────────────────────────
  {
    id: 20,
    name: 'King Coconut',
    category: 'Beverages',
    price: 180,
    calories: 90,
    prepTime: '2 min',
    isNew: false,
    description:
      'Fresh Sri Lankan king coconut water — naturally sweet, hydrating and served chilled. Nature\'s best sports drink.',
    ingredients: ['King Coconut Water'],
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 21,
    name: 'Mango Lassi',
    category: 'Beverages',
    price: 350,
    calories: 210,
    prepTime: '5 min',
    isNew: true,
    description:
      'Thick, creamy mango lassi blended with fresh Alphonso mango, yoghurt and a pinch of cardamom.',
    ingredients: ['Mango', 'Yoghurt', 'Milk', 'Sugar', 'Cardamom'],
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 22,
    name: 'Ceylon Tea',
    category: 'Beverages',
    price: 150,
    calories: 10,
    prepTime: '5 min',
    isNew: false,
    description:
      'Freshly brewed high-grown Ceylon tea served with milk and sugar on the side. The perfect companion to any meal.',
    ingredients: ['Ceylon Tea Leaves', 'Hot Water', 'Milk', 'Sugar'],
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop&q=80',
  },
]

/** All unique categories derived from the data, prefixed with "All" */
export const CATEGORIES = ['All', ...new Set(MENU_ITEMS.map(i => i.category))]
