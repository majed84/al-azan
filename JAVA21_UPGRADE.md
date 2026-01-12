# تحديث المشروع للتوافق مع Java 21

## التغييرات المطبقة

### 1. تحديث Gradle
- **من:** Gradle 8.6
- **إلى:** Gradle 8.10.2
- **السبب:** Gradle 8.10+ يدعم Java 21 بشكل كامل

### 2. تحديث Android Build Tools
- **compileSdkVersion:** 34 → 35
- **targetSdkVersion:** 34 → 35
- **buildToolsVersion:** 34.0.0 → 35.0.0
- **ndkVersion:** 26.1.10909125 → 27.0.12077973

### 3. تحديث Kotlin
- **من:** 1.9.22
- **إلى:** 2.0.21
- **السبب:** Kotlin 2.0+ يدعم Java 21 بشكل أفضل

## خطوات ما بعد التحديث

### 1. تنظيف المشروع
```bash
cd android
./gradlew clean
```

### 2. إعادة بناء المشروع
```bash
./gradlew build
```

### 3. تشغيل التطبيق
```bash
cd ..
yarn android
```

## التحقق من Java 21

تأكد من أن Java 21 مثبت ومُعرّف في `gradle.properties`:
```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-21
```

للتحقق من إصدار Java:
```bash
java -version
```

يجب أن يظهر: `openjdk version "21"` أو `java version "21"`

## ملاحظات مهمة

1. **Android Studio:** تأكد من استخدام Android Studio Hedgehog (2023.1.1) أو أحدث
2. **AGP:** React Native 0.74.5 يستخدم Android Gradle Plugin 8.3.x تلقائياً (متوافق مع Java 21)
3. **Node.js:** المشروع يتطلب Node >= 18 (موجود في package.json)

## مشاكل محتملة وحلولها

### مشكلة: Gradle لا يتعرف على Java 21
**الحل:**
```bash
# تعيين JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-21
```

### مشكلة: فشل البناء بسبب مكتبات قديمة
**الحل:**
```bash
cd android
./gradlew --stop
./gradlew clean
./gradlew build --refresh-dependencies
```

### مشكلة: تعارض في إصدارات المكتبات
**الحل:**
```bash
# حذف cache
rm -rf node_modules
rm -rf android/.gradle
rm -rf android/build
rm -rf android/app/build

# إعادة التثبيت
yarn install
cd android && ./gradlew clean
```

## التوافق

- ✅ Java 21
- ✅ Gradle 8.10.2
- ✅ Android SDK 35
- ✅ Kotlin 2.0.21
- ✅ React Native 0.74.5
- ✅ Node.js >= 18

## المراجع

- [Gradle Java 21 Support](https://docs.gradle.org/current/userguide/compatibility.html)
- [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- [Kotlin 2.0 Release](https://kotlinlang.org/docs/whatsnew20.html)
