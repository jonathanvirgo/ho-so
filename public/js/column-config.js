// ============================================
// CẤU HÌNH CỘT CHUNG - Sử dụng cho nhiều modules
// ============================================

const availableColumns = {
    // Thông tin cơ bản
    'name': { label: 'Tên thực phẩm', group: 'basic', default: true },
    'ten': { label: 'Tên tiếng Việt', group: 'basic', default: false },
    'code': { label: 'Mã thực phẩm', group: 'basic', default: false },
    'weight': { label: 'Khối lượng (g)', group: 'basic', default: true },
    'edible': { label: 'Phần ăn được (%)', group: 'basic', default: false },

    // Chất dinh dưỡng chính (đã gộp vào food_info)
    'energy': { label: 'Năng lượng (kcal)', group: 'main_nutrients', default: true },
    'water': { label: 'Nước (g)', group: 'main_nutrients', default: false },
    'protein': { label: 'Protein (g)', group: 'main_nutrients', default: true },
    'fat': { label: 'Chất béo (g)', group: 'main_nutrients', default: true },
    'carbohydrate': { label: 'Carbohydrate (g)', group: 'main_nutrients', default: true },
    'fiber': { label: 'Chất xơ (g)', group: 'main_nutrients', default: false },
    'ash': { label: 'Tro (g)', group: 'main_nutrients', default: false },

    // Khoáng chất
    'calci': { label: 'Canxi (mg)', group: 'minerals', default: false },
    'phosphorous': { label: 'Phospho (mg)', group: 'minerals', default: false },
    'fe': { label: 'Sắt (mg)', group: 'minerals', default: false },
    'zinc': { label: 'Kẽm (mg)', group: 'minerals', default: false },
    'sodium': { label: 'Natri (mg)', group: 'minerals', default: false },
    'potassium': { label: 'Kali (mg)', group: 'minerals', default: false },
    'magnesium': { label: 'Magie (mg)', group: 'minerals', default: false },
    'manganese': { label: 'Mangan (mg)', group: 'minerals', default: false },
    'copper': { label: 'Đồng (mg)', group: 'minerals', default: false },
    'selenium': { label: 'Selen (μg)', group: 'minerals', default: false },
    
    // Axit béo
    'total_saturated_fat': { label: 'Axit béo bão hòa (g)', group: 'fatty_acids', default: false },
    'mufa': { label: 'Axit béo không bão hòa đơn (g)', group: 'fatty_acids', default: false },
    'fufa': { label: 'Axit béo không bão hòa đa (g)', group: 'fatty_acids', default: false },
    'pufa': { label: 'PUFA - Axit béo không bão hòa đa (g)', group: 'fatty_acids', default: false },
    'oleic': { label: 'Oleic (g)', group: 'fatty_acids', default: false },
    'linoleic': { label: 'Linoleic (g)', group: 'fatty_acids', default: false },
    'linolenic': { label: 'Linolenic (g)', group: 'fatty_acids', default: false },
    'arachidonic': { label: 'Arachidonic (g)', group: 'fatty_acids', default: false },
    'trans_fatty_acids': { label: 'Trans fat (g)', group: 'fatty_acids', default: false },
    'epa': { label: 'EPA (g)', group: 'fatty_acids', default: false },
    'dha': { label: 'DHA (g)', group: 'fatty_acids', default: false },
    'cholesterol': { label: 'Cholesterol (mg)', group: 'fatty_acids', default: false },
    
    // Protein & Amino acid (food_info)
    'animal_protein': { label: 'Protein động vật (g)', group: 'amino_acids', default: false },
    'lysin': { label: 'Lysin (mg)', group: 'amino_acids', default: false },
    'methionin': { label: 'Methionin (mg)', group: 'amino_acids', default: false },
    'tryptophan': { label: 'Tryptophan (mg)', group: 'amino_acids', default: false },
    'phenylalanin': { label: 'Phenylalanin (mg)', group: 'amino_acids', default: false },
    'threonin': { label: 'Threonin (mg)', group: 'amino_acids', default: false },
    'isoleucine': { label: 'Isoleucine (mg)', group: 'amino_acids', default: false },
    'leucine': { label: 'Leucine (mg)', group: 'amino_acids', default: false },
    'valine': { label: 'Valine (mg)', group: 'amino_acids', default: false },
    'arginine': { label: 'Arginine (mg)', group: 'amino_acids', default: false },
    'histidine': { label: 'Histidine (mg)', group: 'amino_acids', default: false },
    'alanine': { label: 'Alanine (mg)', group: 'amino_acids', default: false },
    'aspartic_acid': { label: 'Axit aspartic (mg)', group: 'amino_acids', default: false },
    'glutamic_acid': { label: 'Axit glutamic (mg)', group: 'amino_acids', default: false },
    'glycine': { label: 'Glycine (mg)', group: 'amino_acids', default: false },
    'proline': { label: 'Proline (mg)', group: 'amino_acids', default: false },
    'serine': { label: 'Serine (mg)', group: 'amino_acids', default: false },
    'tyrosine': { label: 'Tyrosine (mg)', group: 'amino_acids', default: false },
    'cystine': { label: 'Cystine (mg)', group: 'amino_acids', default: false },
    
    // Vitamin
    'vitamin_a_rae': { label: 'Vitamin A (μg RAE)', group: 'vitamins', default: false },
    'vitamin_a_ui': { label: 'Vitamin A UI (μg)', group: 'vitamins', default: false },
    'vitamin_b6': { label: 'Vitamin B6 (mg)', group: 'vitamins', default: false },
    'vitamin_b12': { label: 'Vitamin B12 (μg)', group: 'vitamins', default: false },
    'vitamin_c': { label: 'Vitamin C (mg)', group: 'vitamins', default: false },
    'vitamin_e': { label: 'Vitamin E (mg)', group: 'vitamins', default: false },
    'vitamin_k': { label: 'Vitamin K (μg)', group: 'vitamins', default: false },
    'vitamin_d': { label: 'Vitamin D (μg)', group: 'vitamins', default: false },
    'vitamin_d_ui': { label: 'Vitamin D UI (μg)', group: 'vitamins', default: false },
    'niacin': { label: 'Niacin (mg)', group: 'vitamins', default: false },
    'pantothenic_acid': { label: 'Axit pantothenic (mg)', group: 'vitamins', default: false },
    'biotin': { label: 'Biotin (μg)', group: 'vitamins', default: false },
    'b_carotene': { label: 'Beta-carotene (μg)', group: 'vitamins', default: false },
    'a_carotene': { label: 'Alpha-carotene (μg)', group: 'vitamins', default: false },
    'b_cryptoxanthin': { label: 'Beta-cryptoxanthin (μg)', group: 'vitamins', default: false },
                
    // Đường
    'total_sugar': { label: 'Tổng đường (g)', group: 'sugars', default: false },
    'glucose': { label: 'Glucose (g)', group: 'sugars', default: false },
    'fructose': { label: 'Fructose (g)', group: 'sugars', default: false },
    'sucrose': { label: 'Sucrose (g)', group: 'sugars', default: false },
    'lactose': { label: 'Lactose (g)', group: 'sugars', default: false },
    'maltose': { label: 'Maltose (g)', group: 'sugars', default: false },
    'galactose': { label: 'Galactose (g)', group: 'sugars', default: false },

    // Vi lượng khác
    'fluoride': { label: 'Fluoride (mg)', group: 'minerals', default: false },
    'iodine': { label: 'Iod (μg)', group: 'minerals', default: false },
    'choline': { label: 'Choline (mg)', group: 'minerals', default: false },
    'taurine': { label: 'Taurine (mg)', group: 'minerals', default: false },
    
    // Carotenoid và chất chống oxy hóa
    'lycopene': { label: 'Lycopene (μg)', group: 'antioxidants', default: false },
    'lutein_zeaxanthin': { label: 'Lutein + Zeaxanthin (μg)', group: 'antioxidants', default: false },
    'caroten': { label: 'Carotenoid (μg)', group: 'antioxidants', default: false },
    
    // Isoflavone và phytoestrogen
    'total_isoflavone': { label: 'Tổng Isoflavone (mg)', group: 'phytonutrients', default: false },
    'daidzein': { label: 'Daidzein (mg)', group: 'phytonutrients', default: false },
    'genistein': { label: 'Genistein (mg)', group: 'phytonutrients', default: false },
    'glycetin': { label: 'Glycetin (mg)', group: 'phytonutrients', default: false },
    'phytosterol': { label: 'Phytosterol (mg)', group: 'phytonutrients', default: false },
    
    // Purine và chất chuyển hóa
    'purine': { label: 'Purine (mg)', group: 'metabolites', default: false },
    
    // Protein bổ sung
    'unanimal_protein': { label: 'Protein thực vật (g)', group: 'amino_acids', default: false },
    
    // Lipid bổ sung
    'animal_lipid': { label: 'Lipid động vật (g)', group: 'fatty_acids', default: false },
    'unanimal_lipid': { label: 'Lipid thực vật (g)', group: 'fatty_acids', default: false },
    
    // Axit béo bão hòa bổ sung
    'palmitic': { label: 'Axit Palmitic (g)', group: 'fatty_acids', default: false },
    'margaric': { label: 'Axit Margaric (g)', group: 'fatty_acids', default: false },
    'stearic': { label: 'Axit Stearic (g)', group: 'fatty_acids', default: false },
    'arachidic': { label: 'Axit Arachidic (g)', group: 'fatty_acids', default: false },
    'behenic': { label: 'Axit Behenic (g)', group: 'fatty_acids', default: false },
    'lignoceric': { label: 'Axit Lignoceric (g)', group: 'fatty_acids', default: false },
    'mct': { label: 'Triglyceride chuỗi (g)', group: 'fatty_acids', default: false },
    
    // Axit béo không bão hòa đơn bổ sung
    'myristoleic': { label: 'Axit Myristoleic (g)', group: 'fatty_acids', default: false },
    'palmitoleic': { label: 'Axit Palmitoleic (g)', group: 'fatty_acids', default: false },
    
    // Vitamin bổ sung
    'riboflavin': { label: 'Riboflavin - B2 (mg)', group: 'vitamins', default: false },
    'thiamine': { label: 'Thiamine - B1 (mg)', group: 'vitamins', default: false },
    'folic_acid': { label: 'Axit Folic (μg)', group: 'vitamins', default: false }
};

const columnGroups = {
    'basic': 'Thông tin cơ bản',
    'main_nutrients': 'Chất dinh dưỡng chính',
    'minerals': 'Khoáng chất',
    'fatty_acids': 'Axit béo',
    'amino_acids': 'Protein & Amino acid',
    'vitamins': 'Vitamin',
    'sugars': 'Đường',
    'antioxidants': 'Chất chống oxy hóa',
    'phytonutrients': 'Phytonutrient',
    'metabolites': 'Chất chuyển hóa'
};
