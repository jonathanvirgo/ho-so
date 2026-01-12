# 🔐 Hướng Dẫn Xóa API Keys/Secrets Khỏi Git History

> [!CAUTION]
> **Các API keys của bạn đã bị lộ!** Ngay lập tức hãy:
> 1. Thu hồi (revoke) tất cả các keys cũ
> 2. Tạo keys mới từ các dịch vụ tương ứng
> 3. Xóa các keys cũ khỏi git history theo hướng dẫn bên dưới

## 📋 Danh Sách API Keys Cần Thu Hồi

| Service | Link Thu Hồi/Tạo Mới |
|---------|---------------------|
| OpenWeather | https://home.openweathermap.org/api_keys |
| Google reCAPTCHA | https://www.google.com/recaptcha/admin |
| Telegram Bot | Tạo bot mới qua [@BotFather](https://t.me/BotFather) |
| Google Service Account | [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts) |
| Gemini AI | https://aistudio.google.com/app/apikey |
| Pinecone | https://app.pinecone.io/ |

---

## 🛠️ Phương Pháp 1: Sử Dụng BFG Repo-Cleaner (Khuyến Nghị)

BFG nhanh hơn và dễ sử dụng hơn `git filter-branch`.

### Bước 1: Cài đặt BFG

```bash
# Ubuntu/Debian
sudo apt install default-jre
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O bfg.jar

# macOS
brew install bfg
```

### Bước 2: Tạo file chứa các secrets cần xóa

```bash
# Tạo file replacements.txt với format: literal:SECRET_VALUE==>***REMOVED***
cat > replacements.txt << 'EOF'
literal:9dc59d40560634d2e2a5f0489ec0708d==>***REMOVED***
literal:6LecOwArAAAAAL5ayT4AOz5QDzTp9ARzZXSxHEzT==>***REMOVED***
literal:6LecOwArAAAAAC4UDNEV_h4rO6FzT1jbDTcOchef==>***REMOVED***
literal:7892858213:AAGEAlHb_gTD9UIVcaCfatNPGNA3QvhpjzM==>***REMOVED***
literal:AIzaSyDlndZS8HktoUFggtVi96dPOVupbxSo5Rk==>***REMOVED***
literal:pcsk_XKj54_EZkdZ42Dfv8RkdvsWw6UDBeruQVvA8ot72BCGaNvBvXjremNy9AbUiaLHe6VKWp==>***REMOVED***
literal:0fgveo3owXgowVUYmFvuBGAfZM==>***REMOVED***
literal:gzw6Fb928shpueTLW1hkHU8fIuTmWzmn==>***REMOVED***
literal:C@taiphat==>***REMOVED***
EOF
```

### Bước 3: Clone repo (mirror mode)

```bash
git clone --mirror git@github.com:username/benh-nhan.git benh-nhan-mirror
cd benh-nhan-mirror
```

### Bước 4: Chạy BFG

```bash
# Thay thế các secrets
java -jar ../bfg.jar --replace-text ../replacements.txt

# Hoặc xóa hoàn toàn file .env nếu có trong history
java -jar ../bfg.jar --delete-files .env
```

### Bước 5: Dọn dẹp và force push

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## 🛠️ Phương Pháp 2: Sử Dụng git filter-repo

### Bước 1: Cài đặt git-filter-repo

```bash
# Ubuntu/Debian
pip install git-filter-repo

# macOS
brew install git-filter-repo
```

### Bước 2: Backup repository

```bash
cp -r benh-nhan benh-nhan-backup
cd benh-nhan
```

### Bước 3: Tạo file expressions.txt

```bash
cat > expressions.txt << 'EOF'
regex:9dc59d40560634d2e2a5f0489ec0708d==>***REMOVED***
regex:6LecOwArAAAAAL5ayT4AOz5QDzTp9ARzZXSxHEzT==>***REMOVED***
regex:6LecOwArAAAAAC4UDNEV_h4rO6FzT1jbDTcOchef==>***REMOVED***
regex:7892858213:AAGEAlHb_gTD9UIVcaCfatNPGNA3QvhpjzM==>***REMOVED***
regex:AIzaSyDlndZS8HktoUFggtVi96dPOVupbxSo5Rk==>***REMOVED***
regex:pcsk_XKj54_EZkdZ42Dfv8RkdvsWw6UDBeruQVvA8ot72BCGaNvBvXjremNy9AbUiaLHe6VKWp==>***REMOVED***
regex:0fgveo3owXgowVUYmFvuBGAfZM==>***REMOVED***
regex:gzw6Fb928shpueTLW1hkHU8fIuTmWzmn==>***REMOVED***
regex:C@taiphat==>***REMOVED***
EOF
```

### Bước 4: Chạy filter-repo

```bash
git filter-repo --replace-text expressions.txt --force
```

### Bước 5: Force push

```bash
git remote add origin git@github.com:username/benh-nhan.git
git push --force --all
git push --force --tags
```

---

## 🛠️ Phương Pháp 3: Xóa File Cụ Thể Khỏi History

Nếu chỉ cần xóa 1 file như `.env`:

```bash
# Sử dụng git filter-repo
git filter-repo --invert-paths --path .env --force

# Sau đó force push
git push origin --force --all
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Force push sẽ viết lại lịch sử** - Tất cả collaborators cần clone lại repo
2. **GitHub có thể cache** - Liên hệ GitHub support để xóa cache
3. **Luôn backup trước khi làm** - Lưu bản sao repository

## 🔒 Phòng Tránh Trong Tương Lai

### 1. Cập nhật `.gitignore`

```bash
# Secrets
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

### 2. Sử dụng git hooks để kiểm tra secrets

Tạo file `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Kiểm tra patterns của API keys
PATTERNS="AKIA|AIza|sk-|pk_|secret|password|apikey|api_key"
if git diff --cached | grep -iE "$PATTERNS"; then
    echo "⚠️ Phát hiện có thể là secrets trong commit!"
    echo "Vui lòng kiểm tra lại trước khi commit."
    exit 1
fi
```

### 3. Sử dụng công cụ quét secrets

```bash
# Cài đặt gitleaks
brew install gitleaks  # macOS
# hoặc
docker pull zricethezav/gitleaks

# Quét repository
gitleaks detect --source . --verbose
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, liên hệ:
- [GitHub Support](https://support.github.com/) - Yêu cầu xóa cache
- [BFG Documentation](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
