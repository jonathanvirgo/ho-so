# Hệ thống Nghiên cứu Dinh dưỡng - Luồng xử lý

## Tổng quan
Hệ thống nghiên cứu dinh dưỡng cho phép tạo và quản lý các nghiên cứu về dinh dưỡng của bệnh nhân, bao gồm việc tạo thực đơn từ thực phẩm và món ăn, tính toán tổng dinh dưỡng, và xuất báo cáo Excel.

## Cấu trúc dữ liệu chính

### 1. **food_info** - Thông tin thực phẩm
```sql
- id: ID thực phẩm
- name: Tên thực phẩm
- code: Mã thực phẩm
- type: Loại (raw/cooked/cooked_vdd/milk/ddd)
- type_year: Năm dữ liệu (2000/2007/2017/2025)
- energy, protein, lipid, carbohydrate, fiber, water, ash: Chất dinh dưỡng chính
- calci, phosphorous, fe, zinc, sodium, potassium, magnesium: Khoáng chất
- vitamin_a_rae, vitamin_c, vitamin_e: Vitamin (đã bỏ: vitamin_b1, vitamin_b2, retinol, vitamin_pp, vitamin_b9, folate)
- lysin, methionin, tryptophan, phenylalanin: Amino acid
- total_sugar, glucose, fructose, sucrose, lactose, maltose: Đường
- lycopene, b_carotene, phytosterol, purine: Các chất khác
- + 50+ trường dinh dưỡng khác
```

### 2. **dishes** - Món ăn
```sql
- id: ID món ăn
- name: Tên món ăn
- description: Mô tả
- category: Loại món ăn
- active: Trạng thái
```

### 3. **dish_foods** - Thực phẩm trong món ăn
```sql
- id: ID bản ghi
- dish_id: ID món ăn
- food_id: ID thực phẩm
- weight: Khối lượng (gram)
- order_index: Thứ tự
```

### 4. **research** - Nghiên cứu
```sql
- id: ID nghiên cứu
- name: Tên nghiên cứu
- note: Ghi chú
- active: Trạng thái
```

### 5. **patients_research** - Bệnh nhân trong nghiên cứu
```sql
- id: ID bệnh nhân
- id_research: ID nghiên cứu
- fullname: Tên bệnh nhân
- menu_example: JSON chứa thực đơn
- active: Trạng thái
```

## Luồng xử lý chính

### 1. **Tạo thực đơn cho bệnh nhân**

#### A. Thêm thực phẩm trực tiếp
```javascript
// Frontend: menuExample.js
addFoodToMenu() {
    // 1. Lấy thông tin thực phẩm từ food_info
    // 2. Tính toán dinh dưỡng theo khối lượng: (giá_trị / 100) * khối_lượng
    // 3. Thêm vào thực đơn với cấu trúc:
    {
        id: unique_id,
        id_food: food_id,
        name: food_name,
        weight: weight_in_grams,
        // Tất cả các trường dinh dưỡng đã tính toán
        energy: calculated_energy,
        protein: calculated_protein,
        // ... 50+ trường khác
    }
}
```

#### B. Thêm món ăn vào thực đơn
```javascript
// Frontend: menuExample.js
addDishToMenu() {
    // 1. Gọi API /api/dish-foods/{dish_id}
    // 2. Nhận danh sách thực phẩm trong món ăn với calculated_* values
    // 3. Thêm từng thực phẩm vào thực đơn với tên gốc + (tên món ăn)
}

// Backend: dishController.js
getDishFoods() {
    // 1. Query: SELECT df.*, fi.* FROM dish_foods df LEFT JOIN food_info fi
    // 2. Tính toán dinh dưỡng cho từng thực phẩm:
    nutritionFields.forEach(field => {
        calculatedNutrients[`calculated_${field}`] = (parseFloat(food[field]) || 0) * ratio;
    });
    // 3. Trả về danh sách thực phẩm với calculated_* values
}
```

### 2. **Cấu trúc thực đơn (menu_example)**
```json
{
    "name": "Thực đơn ngày 1",
    "created_at": "2025-01-02T10:00:00Z",
    "detail": [
        {
            "id": 1,
            "name": "Sáng",
            "listFood": [
                {
                    "id": 1,
                    "id_food": 123,
                    "name": "Cơm trắng",
                    "weight": 200,
                    "energy": 260,
                    "protein": 5.4,
                    "carbohydrate": 58.2,
                    // ... tất cả trường dinh dưỡng
                },
                {
                    "id": 2,
                    "id_food": 456,
                    "name": "Thịt gà (Cơm gà luộc)",
                    "weight": 100,
                    "energy": 165,
                    // ... từ món ăn
                }
            ]
        },
        {
            "id": 2,
            "name": "Trưa",
            "listFood": [...]
        }
    ]
}
```

### 3. **Xuất Excel nghiên cứu**

#### A. Luồng xử lý
```javascript
// Frontend: confirmExportExcel()
1. Chọn các trường cần xuất từ modal
2. Gửi POST /research/export-excel/{research_id} với selectedFields

// Backend: researchController.exportExcel()
1. Lấy danh sách bệnh nhân trong nghiên cứu
2. Parse menu_example JSON của từng bệnh nhân
3. Tính tổng dinh dưỡng từ tất cả thực phẩm trong thực đơn
4. Tạo file Excel với các cột được chọn
```

#### B. Tính toán tổng dinh dưỡng
```javascript
function calculateNutritionFromMenu(menu) {
    const totalNutrition = {
        energy: 0, protein: 0, // ... tất cả 50+ trường
    };
    
    // Duyệt qua tất cả bữa ăn
    menu.detail.forEach(meal => {
        // Duyệt qua tất cả thực phẩm trong bữa ăn
        meal.listFood.forEach(food => {
            const weight = parseFloat(food.weight) || 0;
            const ratio = weight / 100;
            
            // Tính tổng tất cả trường dinh dưỡng
            Object.keys(totalNutrition).forEach(key => {
                if (food.hasOwnProperty(key)) {
                    totalNutrition[key] += (parseFloat(food[key]) || 0) * ratio;
                }
            });
        });
    });
    
    return totalNutrition;
}
```

#### C. Xử lý nhiều thực đơn
```javascript
// Nếu bệnh nhân có nhiều thực đơn (array)
if (Array.isArray(menuData)) {
    menuData.forEach((menu, index) => {
        const nutritionData = calculateNutritionFromMenu(menu);
        
        processedData.push({
            fullname: `${patient.fullname} ${index + 1}`,
            menu_name: menu.name || `Thực đơn ${index + 1}`,
            nutrition: nutritionData
        });
    });
}

// Excel sẽ có các dòng:
// Nguyễn Văn A 1 | Thực đơn sáng | 2500 | 80 | ...
// Nguyễn Văn A 2 | Thực đơn trưa | 1800 | 60 | ...
```

### 4. **Cấu trúc file Excel**
```
| Tên bệnh nhân | Tên thực đơn | Năng lượng | Protein | Lipid | ... |
|---------------|--------------|------------|---------|-------|-----|
| Nguyễn Văn A  | Thực đơn 1   | 2500       | 80.5    | 65.2  | ... |
| Nguyễn Văn B  | Thực đơn 1   | 2200       | 75.0    | 58.8  | ... |
```

## API Endpoints chính

### 1. **Thực phẩm**
- `GET /khau-phan-an/food-name?search=` - Tìm kiếm thực phẩm
- `GET /api/food-search?search=&type=&type_year=` - Tìm kiếm với filter

### 2. **Món ăn**
- `GET /api/dishes-for-select` - Danh sách món ăn
- `GET /api/dish-foods/{id}` - Thực phẩm trong món ăn
- `POST /dish/save` - Lưu món ăn

### 3. **Thực đơn**
- `POST /khau-phan-an/save-menu` - Lưu thực đơn

### 4. **Nghiên cứu**
- `POST /research/list` - Danh sách nghiên cứu
- `POST /research/export-excel/{id}` - Xuất Excel

## Đặc điểm kỹ thuật

### 1. **Tính toán động**
- Không lưu trữ tổng số dinh dưỡng trong database
- Tính toán realtime dựa trên khối lượng và thông tin food_info
- Công thức: `(giá_trị_dinh_dưỡng / 100) * khối_lượng`

### 2. **Hỗ trợ đa dạng**
- 50+ trường dinh dưỡng từ food_info
- Hỗ trợ cả thực phẩm đơn lẻ và món ăn phức hợp
- Export Excel với các trường tùy chọn

### 3. **Tối ưu hóa**
- Query đơn giản: `SELECT df.*, fi.* FROM dish_foods df LEFT JOIN food_info fi`
- Sử dụng forEach để tính toán tự động tất cả trường
- Cache kết quả trong frontend để tránh tính toán lại
