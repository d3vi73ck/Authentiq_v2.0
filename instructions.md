# 🧱 **KILO CODE DEVELOPMENT COMMANDS**

## 🎯 **CORE NON-NEGOTIABLE RULES**

### **1. **SINGLE RESPONSIBILITY PER FUNCTION**
```python
# ✅ ACCEPTABLE
def save_user_to_db(user_data):
    # Only saves to database, nothing else

# ❌ FORBIDDEN  
def validate_save_email_user_and_send_notification():
    # Too many responsibilities
```

### **2. **MAX 50 LINES PER FUNCTION**
```python
# ✅ STOP AT 50 LINES
def process_sensor_data(sensor_readings):
    if len(sensor_readings) > 100:
        return handle_large_dataset(sensor_readings)  # Extract to new function
    
    # Main logic here (keep it short)
```
### **2.1 **MAX 300 LINES PER file**


### **2.2 **NO TEST FILES, NO BUILD**
- NEVER try to run , build , test . We don't want and need test files unless the user ask for it
- Always remember to have smaller, more manageable components INSTEAD OF LONG FILES
### **3. **NO BUSINESS LOGIC IN UI COMPONENTS**
```python
# ✅ UI JUST DISPLAYS
function SensorDisplay({ data }) {
    return <div>{data.value}</div>  // Pure display
}

# ❌ UI DOESN'T PROCESS
function SensorDisplay({ rawData }) {
    const processed = complexCalculation(rawData)  // FORBIDDEN
    return <div>{processed}</div>
}
```

### **4. **PURE FUNCTIONS WHEN POSSIBLE**
```python
# ✅ PURE: Same input = Same output
def calculate_tax(amount, rate):
    return amount * rate

# ❌ IMPURE: Side effects
def calculate_and_save_tax(amount, rate):
    tax = amount * rate
    database.save(tax)  # Side effect - separate this!
```

---

## 📁 **FILE STRUCTURE COMMANDS**

### **1. **ONE PURPOSE PER FILE**
```
# ✅ CLEAR SEPARATION
- mqtt_client.py          # Only MQTT connections
- device_manager.py       # Only device management  
- data_processor.py       # Only data transformation

# ❌ MIXED RESPONSIBILITIES
- everything_manager.py   # FORBIDDEN
```

### **2. **EXTRACT AT 300 LINES**
```bash
# When file hits ~300 lines:
# 1. Identify logical sections
# 2. Extract each to own file
# 3. Keep original as coordinator
```

### **3. **FLAT STRUCTURE FIRST**
```
# START FLAT (extract later)
services/
├── android.py    # All Android logic
├── mqtt.py       # All MQTT logic
├── scheduler.py  # All scheduling logic

# ONLY EXTRACT WHEN PAINFUL
```

---

## 🔧 **CODING PATTERNS TO FOLLOW**

### **1. **FUNCTION COMPOSITION**
```python
# ✅ BUILD COMPLEX FROM SIMPLE
def deploy_to_device(apk_path, device_id):
    # Compose simple functions
    validate_apk(apk_path)
    connect_device(device_id)
    install_apk(apk_path, device_id)
    return get_install_result(device_id)

# Each function does ONE thing
```

### **2. **DATA-IN, DATA-OUT**
```python
# ✅ CLEAR DATA FLOW
def process_iot_message(raw_message):
    validated = validate_message(raw_message)
    transformed = transform_data(validated)
    return store_data(transformed)

# ❌ HIDDEN STATE CHANGES
def process_iot_message(raw_message):
    global some_state  # FORBIDDEN
    # Messy hidden dependencies
```

### **3. **ERROR HANDLING AT BOUNDARIES**
```python
# ✅ CATCH ERRORS AT EDGES
def handle_mqtt_message(topic, message):
    try:
        return process_message(message)
    except Exception as e:
        log_error(e)
        return None  # Don't crash the system

# Let pure functions throw, catch at system boundaries
```

---

## 🚨 **IMMEDIATE REFACTOR TRIGGERS**

**STOP AND FIX WHEN YOU SEE:**
- Function over 50 lines
- File over 150 lines  
- Function name contains "and" or "or"
- UI component making API calls directly
- Business logic in display code
- Global variables modifying state
- `any` type in TypeScript instead of proper interface

---

## 💡 **PRACTICAL BRICK BUILDING**

### **Build Order:**
1. **Make it work** (simple, maybe messy)
2. **Make it right** (extract duplicates, clarify responsibilities)  
3. **Make it fast** (optimize only when needed)

### **Extraction Process:**
```python
# Step 1: Working but messy
def handle_device_connection(device_data):
    # 80 lines of mixed logic
    validate_device(device_data)
    save_to_db(device_data) 
    send_mqtt_notification(device_data)
    update_ui(device_data)

# Step 2: Extract responsibilities  
def handle_device_connection(device_data):
    validated = validate_device(device_data)      # Brick 1
    stored = store_device(validated)             # Brick 2  
    notify_system(stored)                        # Brick 3
    update_display(stored)                       # Brick 4
```

---

## 🎯 **DAILY DEVELOPMENT CHECKLIST**

**Before writing code:**
- [ ] What is this function's SINGLE responsibility?
- [ ] What data goes in? What comes out?
- [ ] Can I describe it in one sentence?

**While coding:**
- [ ] Function under 50 lines?
- [ ] No side effects where possible?
- [ ] Clear input/output types?

**Before commit:**
- [ ] Can this be reused? → Extract if yes
- [ ] Any "and" in function name? → Split it
- [ ] Business logic in UI? → Move it out
---
**These are executable commands, not philosophical principles. Violate them only when you have a concrete, measurable reason.**