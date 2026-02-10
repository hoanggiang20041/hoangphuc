import { 
  auth, db, storage, 
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, 
  ref, uploadBytesResumable, getDownloadURL 
} from './firebase-config.js';

const DOM = {
  viewLogin: document.getElementById('viewLogin'),
  viewDashboard: document.getElementById('viewDashboard'),
  email: document.getElementById('email'),
  btnSendLink: document.getElementById('btnSendLink'),
  btnSignOut: document.getElementById('btnSignOut'),
  loginMsg: document.getElementById('loginMsg'),
  who: document.getElementById('who'),
  tabs: document.getElementById('tabs'),
  editor: document.getElementById('editor'),
  btnSave: document.getElementById('btnSave'),
  btnReload: document.getElementById('btnReload')
};

const PAGES = [
  { id: 'homepage', label: 'Trang chủ' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'gallery', label: 'Thư viện' }
];

let activeTab = 'homepage';
let pageData = null;

// --- AUTH LOGIC ---

async function handleSignIn() {
  const email = DOM.email.value;
  if (!email) return alert('Vui lòng nhập email');

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    DOM.loginMsg.innerText = 'Kiểm tra email của bạn để nhận link đăng nhập!';
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}

async function checkSignInLink() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) email = window.prompt('Nhập email xác nhận:');
    
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      alert('Link hết hạn hoặc không hợp lệ');
    }
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    DOM.viewLogin.classList.add('hide');
    DOM.viewDashboard.classList.remove('hide');
    DOM.btnSignOut.classList.remove('hide');
    DOM.who.innerText = user.email;
    initDashboard();
  } else {
    DOM.viewLogin.classList.remove('hide');
    DOM.viewDashboard.classList.add('hide');
    DOM.btnSignOut.classList.add('hide');
  }
});

DOM.btnSendLink.onclick = handleSignIn;
DOM.btnSignOut.onclick = () => signOut(auth);
DOM.btnReload.onclick = () => loadPageData(activeTab);
DOM.btnSave.onclick = savePageData;

// --- DASHBOARD LOGIC ---

function initDashboard() {
  DOM.tabs.innerHTML = '';
  PAGES.forEach(page => {
    const btn = document.createElement('button');
    btn.className = `tab ${activeTab === page.id ? 'active' : ''}`;
    btn.innerText = page.label;
    btn.onclick = () => {
      activeTab = page.id;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      loadPageData(activeTab);
    };
    DOM.tabs.appendChild(btn);
  });
  loadPageData(activeTab);
}

async function loadPageData(pageId) {
  DOM.editor.innerHTML = '<div class="hint">Đang tải dữ liệu...</div>';
  const docRef = doc(db, 'website_content', pageId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    pageData = snap.data();
  } else {
    // Khởi tạo data mẫu nếu chưa có
    pageData = { sections: [{ id: Date.now(), title: 'Tiêu đề mới', description: '', media_url: '', media_type: 'image' }] };
  }
  renderEditor();
}

function renderEditor() {
  DOM.editor.innerHTML = '';
  (pageData.sections || []).forEach((section, index) => {
    const div = document.createElement('div');
    div.className = 'section';
    div.innerHTML = `
      <div class="sectionHead">
        <strong>Phần ${index + 1}</strong>
        <button class="btn secondary" onclick="removeSection(${index})">Xóa</button>
      </div>
      <div class="grid2">
        <div>
          <label>Tiêu đề</label>
          <input value="${section.title || ''}" onchange="updateVal(${index}, 'title', this.value)">
          <label>Mô tả</label>
          <textarea onchange="updateVal(${index}, 'description', this.value)">${section.description || ''}</textarea>
        </div>
        <div>
          <label>Media URL (Ảnh/Video)</label>
          <input value="${section.media_url || ''}" onchange="updateVal(${index}, 'media_url', this.value)">
          <label>Loại Media</label>
          <select onchange="updateVal(${index}, 'media_type', this.value)">
            <option value="image" ${section.media_type === 'image' ? 'selected' : ''}>Hình ảnh</option>
            <option value="video" ${section.media_type === 'video' ? 'selected' : ''}>Video (MP4/YouTube)</option>
          </select>
          <label>Hoặc Upload lên Storage</label>
          <input type="file" accept="image/*,video/mp4" onchange="uploadMedia(${index}, this.files[0])">
          <div id="prog-${index}" class="hint"></div>
        </div>
      </div>
    `;
    DOM.editor.appendChild(div);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'btn secondary';
  addBtn.style.marginTop = '12px';
  addBtn.innerText = '+ Thêm phần mới';
  addBtn.onclick = () => {
    pageData.sections.push({ id: Date.now(), title: '', description: '', media_url: '', media_type: 'image' });
    renderEditor();
  };
  DOM.editor.appendChild(addBtn);
}

// Global window functions for inline events
window.updateVal = (idx, key, val) => {
  pageData.sections[idx][key] = val;
};

window.removeSection = (idx) => {
  if (confirm('Xóa phần này?')) {
    pageData.sections.splice(idx, 1);
    renderEditor();
  }
};

window.uploadMedia = (idx, file) => {
  if (!file) return;
  const prog = document.getElementById(`prog-${idx}`);
  const storageRef = ref(storage, `uploads/${activeTab}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on('state_changed', 
    (snapshot) => {
      const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      prog.innerText = `Đang tải: ${p.toFixed(0)}%`;
    },
    (err) => alert('Upload lỗi: ' + err.message),
    async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      pageData.sections[idx].media_url = url;
      pageData.sections[idx].media_type = file.type.includes('video') ? 'video' : 'image';
      renderEditor();
    }
  );
};

async function savePageData() {
  DOM.btnSave.disabled = true;
  DOM.btnSave.innerText = 'Đang lưu...';
  try {
    const docRef = doc(db, 'website_content', activeTab);
    await setDoc(docRef, {
      ...pageData,
      updated_at: new Date().toISOString(),
      updated_by: auth.currentUser.email
    });
    alert('Đã lưu thành công vào Firestore!');
  } catch (err) {
    alert('Lỗi lưu: ' + err.message);
  }
  DOM.btnSave.disabled = false;
  DOM.btnSave.innerText = 'Lưu Firestore';
}

checkSignInLink();
