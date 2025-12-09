// Git-Integrated Admin Panel
class GitAdminPanel {
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
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
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
            const stats = await this.getWebsiteStats();
            document.getElementById('totalImages').textContent = stats.images;
            document.getElementById('totalVideos').textContent = stats.videos;
            document.getElementById('totalSkills').textContent = stats.skills;
            document.getElementById('totalPages').textContent = stats.pages;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async getWebsiteStats() {
        return {
            images: 25,
            videos: 3,
            skills: 3,
            pages: 2
        };
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
                this.loadCurrentContent();
                break;
            case 'media':
                formContainer.innerHTML = this.getMediaForm();
                this.loadMediaList();
                break;
            case 'skills':
                formContainer.innerHTML = this.getSkillsForm();
                this.loadSkillsList();
                break;
            case 'pages':
                formContainer.innerHTML = this.getPagesForm();
                this.loadPagesList();
                break;
        }

        this.bindFormEvents(type);
    }

    getContentForm() {
        return `
            <div class="content-management">
                <div class="form-group">
                    <label>Tiêu đề chính</label>
                    <input type="text" id="mainTitle" class="form-control" placeholder="MC Hoàng Phúc">
                </div>
                <div class="form-group">
                    <label>Mô tả ngắn</label>
                    <textarea id="mainDescription" class="form-control" rows="3" placeholder="Chuyên nghiệp, trẻ trung, tự tin"></textarea>
                </div>
                <div class="form-group">
                    <label>Số điện thoại</label>
                    <input type="text" id="phone" class="form-control" placeholder="0359 581 896">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" class="form-control" placeholder="mchoangphuc2207@gmail.com">
                </div>
                <div class="form-group">
                    <label>Quote</label>
                    <textarea id="quote" class="form-control" rows="2" placeholder="Mang đến năng lượng tích cực cho mọi sân khấu."></textarea>
                </div>
                <button class="btn btn-primary" onclick="gitAdminPanel.saveContent()">Lưu và cập nhật website</button>
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
                    <button class="btn btn-primary" onclick="gitAdminPanel.uploadMedia()">Tải lên và cập nhật Git</button>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--color-muted);">
                
                <div class="media-library">
                    <h3>Thư viện media hiện có</h3>
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
                    <button class="btn btn-primary" onclick="gitAdminPanel.addSkill()">Thêm kỹ năng và cập nhật Git</button>
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
                    <button class="btn btn-primary" onclick="gitAdminPanel.createPage()">Tạo trang và cập nhật Git</button>
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

    async loadCurrentContent() {
        try {
            // Load current content from main page
            const response = await fetch('/hoangphuc/index.html');
            if (response.ok) {
                const html = await response.text();
                
                // Extract current content
                const titleMatch = html.match(/<title>([^<]+)<\/title>/);
                const phoneMatch = html.match(/tel:([^"]+)/);
                const emailMatch = html.match(/mailto:([^"]+)/);
                
                if (titleMatch) document.getElementById('mainTitle').value = titleMatch[1];
                if (phoneMatch) document.getElementById('phone').value = phoneMatch[1];
                if (emailMatch) document.getElementById('email').value = emailMatch[1];
            }
        } catch (error) {
            console.error('Error loading current content:', error);
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

            // Update the actual HTML files
            await this.updateMainPage(content);
            await this.updateAboutPage(content);
            
            // Commit changes to Git
            await this.commitChanges('Update website content');
            
            this.showNotification('Đã cập nhật website thành công!', 'success');
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi cập nhật!', 'error');
            console.error('Error saving content:', error);
        }
    }

    async updateMainPage(content) {
        try {
            const response = await fetch('/hoangphuc/index.html');
            if (response.ok) {
                let html = await response.text();
                
                // Update title
                html = html.replace(/<title>([^<]+)<\/title>/, `<title>${content.mainTitle}</title>`);
                
                // Update phone
                html = html.replace(/tel:([^"]+)/, `tel:${content.phone}`);
                
                // Update email
                html = html.replace(/mailto:([^"]+)/, `mailto:${content.email}`);
                
                // Save updated HTML
                await this.saveFile('/hoangphuc/index.html', html);
            }
        } catch (error) {
            console.error('Error updating main page:', error);
        }
    }

    async updateAboutPage(content) {
        try {
            const response = await fetch('/hoangphuc/about.html');
            if (response.ok) {
                let html = await response.text();
                
                // Update similar content in about page
                html = html.replace(/<title>([^<]+)<\/title>/, `<title>${content.mainTitle}</title>`);
                
                // Save updated HTML
                await this.saveFile('/hoangphuc/about.html', html);
            }
        } catch (error) {
            console.error('Error updating about page:', error);
        }
    }

    async saveFile(path, content) {
        try {
            // Try to save via API first
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: path,
                    content: content
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save file');
            }
        } catch (error) {
            console.error('Error saving file:', error);
            // Fallback: download file for manual update
            await this.downloadFile(path, content);
        }
    }

    async downloadFile(path, content) {
        try {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = path.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification(`File đã được tải về. Vui lòng copy vào thư mục ${path} và commit vào Git.`, 'warning');
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showNotification('Không thể lưu file. Vui lòng copy nội dung và cập nhật thủ công.', 'error');
        }
    }

    async commitChanges(message) {
        try {
            // Simulate Git commit
            const response = await fetch('/api/git-commit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    files: ['hoangphuc/index.html', 'hoangphuc/about.html']
                })
            });
            
            if (response.ok) {
                this.showNotification('Đã commit thay đổi vào Git!', 'success');
            } else {
                throw new Error('Git commit failed');
            }
        } catch (error) {
            console.error('Error committing to Git:', error);
            this.showNotification('Không thể commit vào Git. Vui lòng commit thủ công.', 'warning');
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
            // Create media item
            const mediaItem = {
                id: Date.now(),
                name: file.name,
                type: type,
                description: description,
                size: file.size,
                uploadDate: new Date().toISOString()
            };

            // Save to localStorage for now
            const existingMedia = JSON.parse(localStorage.getItem('mediaLibrary') || '[]');
            existingMedia.push(mediaItem);
            localStorage.setItem('mediaLibrary', JSON.stringify(existingMedia));

            // Try to save file to server
            await this.saveMediaFile(file, description);
            
            this.showNotification('Tải lên thành công!', 'success');
            this.loadMediaList();
            
            // Reset form
            fileInput.value = '';
            document.getElementById('mediaDescription').value = '';
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi tải lên!', 'error');
        }
    }

    async saveMediaFile(file, description) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);
            formData.append('type', 'media');

            const response = await fetch('/api/upload-media', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            this.showNotification('Không thể lưu file vào server. File đã được lưu vào localStorage.', 'warning');
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

            // Save to localStorage
            const existingSkills = JSON.parse(localStorage.getItem('skills') || '[]');
            existingSkills.push(skill);
            localStorage.setItem('skills', JSON.stringify(existingSkills));

            // Update skills in main page
            await this.updateSkillsInPage(skill);
            
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

    async updateSkillsInPage(skill) {
        try {
            this.showNotification(`Kỹ năng "${skill.name}" cần được thêm vào HTML thủ công hoặc qua API.`, 'info');
        } catch (error) {
            console.error('Error updating skills in page:', error);
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

            // Save to localStorage
            const existingPages = JSON.parse(localStorage.getItem('pages') || '[]');
            existingPages.push(page);
            localStorage.setItem('pages', JSON.stringify(existingPages));

            // Create actual HTML file
            await this.createHTMLPage(url, content);
            
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

    async createHTMLPage(url, content) {
        try {
            const fullHTML = this.generatePageHTML(url, content);
            await this.saveFile(`/${url}.html`, fullHTML);
        } catch (error) {
            console.error('Error creating HTML page:', error);
        }
    }

    generatePageHTML(url, content) {
        return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${url.charAt(0).toUpperCase() + url.slice(1)} - MC Hoàng Phúc</title>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        :root {
            --color-primary: #00ffd1;
            --color-dark: #1e1e1e;
            --color-light: #ffffff;
            --color-muted: #a0a0a0;
            --spacing-unit: 1rem;
            --radius-sm: 6px;
            --radius-md: 12px;
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2);
            --font-main: 'Inter', sans-serif;
            --font-accent: 'EB Garamond', serif;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-main);
            background-color: var(--color-dark);
            color: var(--color-light);
            line-height: 1.6;
            padding-top: 60px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 var(--spacing-unit);
        }
        
        .header {
            background-color: var(--color-dark);
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            padding: var(--spacing-unit) 0;
            box-shadow: var(--shadow-sm);
        }
        
        .header__container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header__logo {
            font-family: var(--font-accent);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--color-light);
            text-transform: uppercase;
        }
        
        .header__nav {
            display: flex;
            gap: calc(var(--spacing-unit) * 1);
        }
        
        .header__nav-link {
            font-family: var(--font-main);
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--color-light);
            text-transform: uppercase;
            padding: calc(var(--spacing-unit) * 0.5);
            text-decoration: none;
        }
        
        .header__nav-link:hover {
            color: var(--color-primary);
        }
        
        .main-content {
            padding: calc(var(--spacing-unit) * 4) 0;
        }
        
        .page-title {
            font-family: var(--font-accent);
            font-size: 2.5rem;
            font-weight: 600;
            color: var(--color-primary);
            text-align: center;
            margin-bottom: calc(var(--spacing-unit) * 2);
        }
        
        .page-content {
            background-color: var(--color-dark);
            padding: calc(var(--spacing-unit) * 2);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            line-height: 1.8;
        }
        
        .page-content h2 {
            color: var(--color-primary);
            margin-bottom: var(--spacing-unit);
        }
        
        .page-content p {
            margin-bottom: var(--spacing-unit);
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container header__container">
            <a href="/hoangphuc/index.html" class="header__logo">MC Hoàng Phúc</a>
            <nav class="header__nav">
                <a href="/hoangphuc/index.html" class="header__nav-link">Trang Chủ</a>
                <a href="/hoangphuc/about.html" class="header__nav-link">Giới Thiệu</a>
                <a href="/${url}.html" class="header__nav-link" style="color: var(--color-primary);">${url.charAt(0).toUpperCase() + url.slice(1)}</a>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <h1 class="page-title">${url.charAt(0).toUpperCase() + url.slice(1)}</h1>
            <div class="page-content">
                ${content}
            </div>
        </div>
    </main>
</body>
</html>`;
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
                    <button class="btn btn-danger" onclick="gitAdminPanel.deleteMedia(${item.id})" style="padding: 5px 10px; font-size: 0.8rem;">
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
                    <button class="btn btn-danger" onclick="gitAdminPanel.deleteSkill(${item.id})" style="padding: 5px 10px; font-size: 0.8rem;">
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
                        <button class="btn btn-primary" onclick="gitAdminPanel.editPage(${page.id})" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="gitAdminPanel.deletePage(${page.id})" style="padding: 5px 10px; font-size: 0.8rem;">
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
        this.showNotification('Tính năng chỉnh sửa trang sẽ được cập nhật sớm!', 'info');
    }

    showNotification(message, type = 'info') {
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

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize Git-integrated admin panel
const gitAdminPanel = new GitAdminPanel();

// Global functions for HTML onclick
function logout() {
    gitAdminPanel.logout();
}

function openModal(type) {
    gitAdminPanel.openModal(type);
}

function closeModal(type) {
    gitAdminPanel.closeModal(type);
} 