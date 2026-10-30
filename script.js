// إعدادات الاتصال السحابي بـ Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAtbuiDat776HcUr92_hyfVt8XcfhLSlUk",
    authDomain: "church-archive-87f29.firebaseapp.com",
    databaseURL: "https://church-archive-87f29-default-rtdb.firebaseio.com",
    projectId: "church-archive-87f29",
    storageBucket: "church-archive-87f29.firebasestorage.app",
    messagingSenderId: "445517101247",
    appId: "1:445517101247:web:137bcfb363ed2bb689ae0a",
    measurementId: "G-LH3S4MQ3HK"
};

// تهيئة الاتصال
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let isAdmin = false;
let archiveData = {};
let awardsData = {};

// جلب البيانات من السحاب فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    db.ref('archiveItems').on('value', (snapshot) => {
        archiveData = snapshot.val() || {};
        const syncEl = document.getElementById('sync-status');
        if (syncEl) syncEl.style.display = 'none';
        renderArchive();
    });

    db.ref('awardsItems').on('value', (snapshot) => {
        awardsData = snapshot.val() || {};
        renderAwards();
    });
});

// تفعيل لوحة المسؤول
function toggleAdminPanel() {
    if (!isAdmin) {
        let pass = prompt("أدخل كلمة مرور المسؤول:");
        if (pass === "1234") {
            isAdmin = true;
            document.getElementById('admin-panel').style.display = 'block';
            document.getElementById('adminToggleBtn').innerText = "🔓 خروج من المسؤول";
            document.getElementById('adminToggleBtn').classList.add('active');
            renderArchive();
            renderAwards();
        } else if (pass !== null) {
            alert("كلمة المرور غير صحيحة!");
        }
    } else {
        isAdmin = false;
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('adminToggleBtn').innerText = "🔒 لوحة المسؤول";
        document.getElementById('adminToggleBtn').classList.remove('active');
        clearForm();
        renderArchive();
        renderAwards();
    }
}

// حفظ أو تعديل نشاط
function saveItem(e) {
    e.preventDefault();
    if (!isAdmin) return;

    const editId = document.getElementById('editItemId').value;
    const category = document.getElementById('itemCategory').value;
    const title = document.getElementById('itemTitle').value;
    const desc = document.getElementById('itemDesc').value;
    const date = document.getElementById('itemDate').value;
    const itemData = { category, title, desc, date };

    if (editId) {
        db.ref('archiveItems/' + editId).set(itemData).then(() => {
            clearForm();
            alert("تم تحديث النشاط بنجاح!");
        });
    } else {
        db.ref('archiveItems').push(itemData).then(() => {
            clearForm();
            alert("تم إضافة النشاط بنجاح للسحاب!");
        });
    }
}

// حفظ فائز جديد
function saveAward(e) {
    e.preventDefault();
    if (!isAdmin) return;

    const title = document.getElementById('awardTitle').value;
    const winner = document.getElementById('winnerName').value;
    const date = document.getElementById('awardDate').value;
    const awardData = { title, winner, date };

    db.ref('awardsItems').push(awardData).then(() => {
        document.getElementById('awardForm').reset();
        alert("تم إضافة الفائز بنجاح!");
    });
}

// حذف نشاط
function deleteItem(id) {
    if (!isAdmin) return;
    if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
        db.ref('archiveItems/' + id).remove();
    }
}

// حذف فائز
function deleteAward(id) {
    if (!isAdmin) return;
    if (confirm("هل أنت متأكد من حذف هذا الفائز؟")) {
        db.ref('awardsItems/' + id).remove();
    }
}

// تعبئة نموذج التعديل
function editItem(id) {
    if (!isAdmin) return;
    const item = archiveData[id];
    if (!item) return;

    document.getElementById('editItemId').value = id;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemTitle').value = item.title;
    document.getElementById('itemDesc').value = item.desc;
    document.getElementById('itemDate').value = item.date;
    document.getElementById('saveBtn').innerText = "حفظ التعديلات ✦";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearForm() {
    document.getElementById('archiveForm').reset();
    document.getElementById('editItemId').value = '';
    document.getElementById('saveBtn').innerText = "حفظ ونشر بالسحاب ✦";
}

let currentFilter = 'all';
function switchTab(category, btn) {
    currentFilter = category;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderArchive();
}

// عرض الأرشيف مع الفلاتر والترتيب الزمني
function renderArchive() {
    const container = document.getElementById('archiveContainer');
    container.innerHTML = '';

    const keys = Object.keys(archiveData);
    if (keys.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">لا يوجد أنشطة مضافة حتى الآن.</p>';
        return;
    }

    keys.sort((a, b) => new Date(archiveData[b].date) - new Date(archiveData[a].date));

    keys.forEach(id => {
        const item = archiveData[id];
        if (currentFilter !== 'all' && item.category !== currentFilter) return;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${item.title}</span>
                <span class="card-badge">${item.category}</span>
            </div>
            <div class="card-desc">${item.desc}</div>
            <div class="card-footer">
                <span>📅 ${item.date}</span>
            </div>
            <div class="admin-actions ${isAdmin ? 'show' : ''}">
                <button class="btn-sm btn-edit" onclick="editItem('${id}')">تعديل</button>
                <button class="btn-sm btn-delete" onclick="deleteItem('${id}')">حذف</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// عرض سجل الفائزين والتايم لاين
function renderAwards() {
    const container = document.getElementById('awardsContainer');
    container.innerHTML = '';

    const keys = Object.keys(awardsData);
    if (keys.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">لا يوجد فائزين مسجلين حتى الآن.</p>';
        return;
    }

    keys.sort((a, b) => new Date(awardsData[b].date) - new Date(awardsData[a].date));

    keys.forEach(id => {
        const award = awardsData[id];
        const card = document.createElement('div');
        card.className = 'award-card';
        card.innerHTML = `
            <div class="award-info">
                <h4>🏆 ${award.title}</h4>
                <p>📅 ${award.date}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="winner-badge">${award.winner}</span>
                ${isAdmin ? `<button class="btn-sm btn-delete" onclick="deleteAward('${id}')">حذف</button>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}