// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadStats();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            this.isLoggedIn = true;
            this.currentUser = JSON.parse(localStorage.getItem('adminUser'));
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple authentication (in production, use proper backend)
        if (username === 'admin' && password === 'hoangphuc2025') {
            const user = { username, role: 'admin' };
            const token = btoa(JSON.stringify(user) + Date.now());
            
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));
            
            this.isLoggedIn = true;
            this.currentUser = user;
            this.showDashboard();
            this.showNotification('Đăng nhập thành công!', 'success');
        } else {
            this.showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
        }
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        this.isLoggedIn = false;
        this.currentUser = null;
        this.showLogin();
        this.showNotification('Đã đăng xuất!', 'info');
    }

    showLogin() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    }

    async loadStats() {
        try {
            // Load media stats
            const mediaStats = await this.getMediaStats();
            document.getElementById('totalImages').textContent = mediaStats.images;
            document.getElementById('totalVideos').textContent = mediaStats.videos;
            
            // Load other stats
            document.getElementById('totalSkills').textContent = '3';
            document.getElementById('totalPages').textContent = '2';
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async getMediaStats() {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    images: 25,
                    videos: 3,
                    audio: 2
                });
            }, 500);
        });
    }

    openModal(type) {
        if (!this.isLoggedIn) {
            this.showNotification('Vui lòng đăng nhập!', 'error');
            return;
        }

        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.style.display = 'block';
            this.loadModalContent(type);
        }
    }

    closeModal(type) {
        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    async loadModalContent(type) {
        const formContainer = document.getElementById(`${type}Form`);
        
        switch (type) {
            case 'content':
                formContainer.innerHTML = this.getContentForm();
                break;
            case 'media':
                formContainer.innerHTML = this.getMediaForm();
                break;
            case 'skills':
                formContainer.innerHTML = this.getSkillsForm();
                break;
            case 'pages':
                formContainer.innerHTML = this.getPagesForm();
                break;
        }

        // Bind form events
        this.bindFormEvents(type);
    }

    getContentForm() {
        return `
            <div class="content-management">
                <div class="form-group">
                    <label>Tiêu đề chính</label>
                    <input type="text" id="mainTitle" value="MC Hoàng Phúc" class="form-control">
                </div>
                <div class="form-group">
                    <label>Mô tả ngắn</label>
                    <textarea id="mainDescription" class="form-control" rows="3">Chuyên nghiệp, trẻ trung, tự tin</textarea>
                </div>
                <div class="form-group">
                    <label>Thông tin liên hệ</label>
                    <input type="text" id="phone" value="0359 581 896" class="form-control">
                    <input type="email" id="email" value="mchoangphuc2207@gmail.com" class="form-control">
                </div>
                <div class="form-group">
                    <label>Quote</label>
                    <textarea id="quote" class="form-control" rows="2">"Mang đến năng lượng tích cực cho mọi sân khấu."</textarea>
                </div>
                <button class="btn btn-primary" onclick="adminPanel.saveContent()">Lưu thay đổi</button>
            </div>
        `;
    }

    getMediaForm() {
        return `
            <div class="media-management">
                <div class="upload-section">
                    <h3>Thêm media mới</h3>
                    <div class="form-group">
                        <label>Loại media</label>
                        <select id="mediaType" class="form-control">
                            <option value="image">Ảnh</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>File</label>
                        <input type="file" id="mediaFile" class="form-control" accept="image/*,video/*,audio/*">
                    </div>
                    <div class="form-group">
                        <label>Mô tả</label>
                        <input type="text" id="mediaDescription" class="form-control" placeholder="Mô tả media">
                    </div>
                    <button class="btn btn-primary" onclick="adminPanel.uploadMedia()">Tải lên</button>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--color-muted);">
                
                <div class="media-library">
                    <h3>Thư viện media</h3>
                    <div id="mediaList" class="media-grid">
                        <!-- Media items will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    getSkillsForm() {
        return `
            <div class="skills-management">
                <div class="add-skill">
                    <h3>Thêm kỹ năng mới</h3>
                    <div class="form-group">
                        <label>Tên kỹ năng</label>
                        <input type="text" id="skillName" class="form-control" placeholder="VD: Dẫn chương trình">
                    </div>
                    <div class="form-group">
                        <label>Mô tả</label>
                        <textarea id="skillDescription" class="form-control" rows="3" placeholder="Mô tả chi tiết kỹ năng"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Icon (FontAwesome class)</label>
                        <input type="text" id="skillIcon" class="form-control" placeholder="VD: fas fa-microphone">
                    </div>
                    <button class="btn btn-primary" onclick="adminPanel.addSkill()">Thêm kỹ năng</button>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--color-muted);">
                
                <div class="existing-skills">
                    <h3>Kỹ năng hiện có</h3>
                    <div id="skillsList">
                        <!-- Skills will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    getPagesForm() {
        return `
            <div class="pages-management">
                <div class="create-page">
                    <h3>Tạo trang mới</h3>
                    <div class="form-group">
                        <label>Tên trang</label>
                        <input type="text" id="pageName" class="form-control" placeholder="VD: Dịch vụ">
                    </div>
                    <div class="form-group">
                        <label>URL</label>
                        <input type="text" id="pageUrl" class="form-control" placeholder="VD: services">
                    </div>
                    <div class="form-group">
                        <label>Nội dung HTML</label>
                        <textarea id="pageContent" class="form-control" rows="10" placeholder="Nhập nội dung HTML của trang"></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="adminPanel.createPage()">Tạo trang</button>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--color-muted);">
                
                <div class="existing-pages">
                    <h3>Trang hiện có</h3>
                    <div id="pagesList">
                        <!-- Pages will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    bindFormEvents(type) {
        // Add specific event bindings for each form type
        switch (type) {
            case 'media':
                this.loadMediaList();
                break;
            case 'skills':
                this.loadSkillsList();
                break;
            case 'pages':
                this.loadPagesList();
                break;
        }
    }

    async saveContent() {
        try {
            const content = {
                mainTitle: document.getElementById('mainTitle').value,
                mainDescription: document.getElementById('mainDescription').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                quote: document.getElementById('quote').value
            };

            // Save to localStorage (in production, save to backend)
            localStorage.setItem('websiteContent', JSON.stringify(content));
            
            this.showNotification('Đã lưu nội dung thành công!', 'success');
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi lưu!', 'error');
        }
    }

    async uploadMedia() {
        const fileInput = document.getElementById('mediaFile');
        const file = fileInput.files[0];
        const type = document.getElementById('mediaType').value;
        const description = document.getElementById('mediaDescription').value;

        if (!file) {
            this.showNotification('Vui lòng chọn file!', 'error');
            return;
        }

        try {
            // Simulate file upload
            const mediaItem = {
                id: Date.now(),
                name: file.name,
                type: type,
                description: description,
                size: file.size,
                uploadDate: new Date().toISOString()
            };

            // Save to localStorage (in production, upload to server)
            const existingMedia = JSON.parse(localStorage.getItem('mediaLibrary') || '[]');
            existingMedia.push(mediaItem);
            localStorage.setItem('mediaLibrary', JSON.stringify(existingMedia));

            this.showNotification('Tải lên thành công!', 'success');
            this.loadMediaList();
            
            // Reset form
            fileInput.value = '';
            document.getElementById('mediaDescription').value = '';
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi tải lên!', 'error');
        }
    }

    async addSkill() {
        const name = document.getElementById('skillName').value;
        const description = document.getElementById('skillDescription').value;
        const icon = document.getElementById('skillIcon').value;

        if (!name || !description) {
            this.showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        try {
            const skill = {
                id: Date.now(),
                name: name,
                description: description,
                icon: icon
            };

            // Save to localStorage (in production, save to backend)
            const existingSkills = JSON.parse(localStorage.getItem('skills') || '[]');
            existingSkills.push(skill);
            localStorage.setItem('skills', JSON.stringify(existingSkills));

            this.showNotification('Đã thêm kỹ năng thành công!', 'success');
            this.loadSkillsList();
            
            // Reset form
            document.getElementById('skillName').value = '';
            document.getElementById('skillDescription').value = '';
            document.getElementById('skillIcon').value = '';
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi thêm kỹ năng!', 'error');
        }
    }

    async createPage() {
        const name = document.getElementById('pageName').value;
        const url = document.getElementById('pageUrl').value;
        const content = document.getElementById('pageContent').value;

        if (!name || !url || !content) {
            this.showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        try {
            const page = {
                id: Date.now(),
                name: name,
                url: url,
                content: content,
                createDate: new Date().toISOString()
            };

            // Save to localStorage (in production, save to backend)
            const existingPages = JSON.parse(localStorage.getItem('pages') || '[]');
            existingPages.push(page);
            localStorage.setItem('pages', JSON.stringify(existingPages));

            this.showNotification('Đã tạo trang thành công!', 'success');
            this.loadPagesList();
            
            // Reset form
            document.getElementById('pageName').value = '';
            document.getElementById('pageUrl').value = '';
            document.getElementById('pageContent').value = '';
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi tạo trang!', 'error');
        }
    }

    loadMediaList() {
        const mediaList = document.getElementById('mediaList');
        const media = JSON.parse(localStorage.getItem('mediaLibrary') || '[]');
        
        if (media.length === 0) {
            mediaList.innerHTML = '<p style="color: var(--color-muted); text-align: center;">Chưa có media nào</p>';
            return;
        }

        mediaList.innerHTML = media.map(item => `
            <div class="media-item" style="border: 1px solid var(--color-muted); padding: 10px; margin: 10px 0; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${item.name}</strong> (${item.type})
                        <br><small style="color: var(--color-muted);">${item.description}</small>
                    </div>
                    <button class="btn btn-danger" onclick="adminPanel.deleteMedia(${item.id})" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadSkillsList() {
        const skillsList = document.getElementById('skillsList');
        const skills = JSON.parse(localStorage.getItem('skills') || '[]');
        
        if (skills.length === 0) {
            skillsList.innerHTML = '<p style="color: var(--color-muted); text-align: center;">Chưa có kỹ năng nào được thêm</p>';
            return;
        }

        skillsList.innerHTML = skills.map(skill => `
            <div class="skill-item" style="border: 1px solid var(--color-muted); padding: 10px; margin: 10px 0; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong><i class="${skill.icon}"></i> ${skill.name}</strong>
                        <br><small style="color: var(--color-muted);">${skill.description}</small>
                    </div>
                    <button class="btn btn-danger" onclick="adminPanel.deleteSkill(${skill.id})" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadPagesList() {
        const pagesList = document.getElementById('pagesList');
        const pages = JSON.parse(localStorage.getItem('pages') || '[]');
        
        if (pages.length === 0) {
            pagesList.innerHTML = '<p style="color: var(--color-muted); text-align: center;">Chưa có trang nào được tạo</p>';
            return;
        }

        pagesList.innerHTML = pages.map(page => `
            <div class="page-item" style="border: 1px solid var(--color-muted); padding: 10px; margin: 10px 0; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${page.name}</strong>
                        <br><small style="color: var(--color-muted);">/${page.url}</small>
                    </div>
                    <div>
                        <button class="btn btn-primary" onclick="adminPanel.editPage(${page.id})" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="adminPanel.deletePage(${page.id})" style="padding: 5px 10px; font-size: 0.8rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    deleteMedia(id) {
        if (confirm('Bạn có chắc muốn xóa media này?')) {
            const media = JSON.parse(localStorage.getItem('mediaLibrary') || '[]');
            const filteredMedia = media.filter(item => item.id !== id);
            localStorage.setItem('mediaLibrary', JSON.stringify(filteredMedia));
            this.loadMediaList();
            this.showNotification('Đã xóa media!', 'success');
        }
    }

    deleteSkill(id) {
        if (confirm('Bạn có chắc muốn xóa kỹ năng này?')) {
            const skills = JSON.parse(localStorage.getItem('skills') || '[]');
            const filteredSkills = skills.filter(skill => skill.id !== id);
            localStorage.setItem('skills', JSON.stringify(filteredSkills));
            this.loadSkillsList();
            this.showNotification('Đã xóa kỹ năng!', 'success');
        }
    }

    deletePage(id) {
        if (confirm('Bạn có chắc muốn xóa trang này?')) {
            const pages = JSON.parse(localStorage.getItem('pages') || '[]');
            const filteredPages = pages.filter(page => page.id !== id);
            localStorage.setItem('pages', JSON.stringify(filteredPages));
            this.loadPagesList();
            this.showNotification('Đã xóa trang!', 'success');
        }
    }

    editPage(id) {
        // Implementation for editing pages
        this.showNotification('Tính năng chỉnh sửa trang sẽ được cập nhật sớm!', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = 'var(--color-success)';
                break;
            case 'error':
                notification.style.backgroundColor = 'var(--color-danger)';
                break;
            case 'warning':
                notification.style.backgroundColor = 'var(--color-warning)';
                break;
            default:
                notification.style.backgroundColor = 'var(--color-primary)';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();

// Global functions for HTML onclick
function logout() {
    adminPanel.logout();
}

function openModal(type) {
    adminPanel.openModal(type);
}

function closeModal(type) {
    adminPanel.closeModal(type);
}

// Add some CSS for form controls
const style = document.createElement('style');
style.textContent = `
    .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--color-muted);
        border-radius: 5px;
        background: var(--color-darker);
        color: var(--color-light);
        font-size: 1rem;
        margin-bottom: 10px;
    }
    
    .form-control:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(0, 255, 209, 0.2);
    }
    
    .btn-primary {
        background: var(--color-primary);
        color: var(--color-dark);
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
    }
    
    .btn-danger {
        background: var(--color-danger);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
    }
    
    .media-grid {
        max-height: 300px;
        overflow-y: auto;
    }
    
    .content-management, .media-management, .skills-management, .pages-management {
        padding: 20px 0;
    }
    
    h3 {
        color: var(--color-primary);
        margin-bottom: 15px;
    }
`;
document.head.appendChild(style); 