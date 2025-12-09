// Content Manager - Quản lý nội dung động
class ContentManager {
    constructor() {
        this.content = null;
        this.init();
    }

    async init() {
        await this.loadContent();
        this.bindEvents();
    }

    async loadContent() {
        try {
            const response = await fetch('/admin/data/content.json');
            if (response.ok) {
                this.content = await response.json();
                this.updateUI();
            } else {
                throw new Error('Không thể tải dữ liệu');
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showNotification('Không thể tải dữ liệu!', 'error');
        }
    }

    bindEvents() {
        // Bind form events
        document.addEventListener('DOMContentLoaded', () => {
            this.bindFormEvents();
        });
    }

    bindFormEvents() {
        // Content form events
        const contentForm = document.getElementById('contentForm');
        if (contentForm) {
            contentForm.addEventListener('submit', (e) => this.handleContentSubmit(e));
        }

        // Media form events
        const mediaForm = document.getElementById('mediaForm');
        if (mediaForm) {
            const uploadBtn = mediaForm.querySelector('#uploadMedia');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => this.handleMediaUpload());
            }
        }

        // Skills form events
        const skillsForm = document.getElementById('skillsForm');
        if (skillsForm) {
            const addSkillBtn = skillsForm.querySelector('#addSkill');
            if (addSkillBtn) {
                addSkillBtn.addEventListener('click', () => this.handleSkillAdd());
            }
        }
    }

    updateUI() {
        if (!this.content) return;

        // Update site stats
        this.updateStats();
        
        // Update content forms
        this.updateContentForm();
        this.updateMediaForm();
        this.updateSkillsForm();
    }

    updateStats() {
        const stats = {
            images: this.content.media.images.length,
            videos: this.content.media.videos.length,
            skills: this.content.skills.length,
            pages: Object.keys(this.content.pages).length
        };

        // Update dashboard stats
        const totalImages = document.getElementById('totalImages');
        const totalVideos = document.getElementById('totalVideos');
        const totalSkills = document.getElementById('totalSkills');
        const totalPages = document.getElementById('totalPages');

        if (totalImages) totalImages.textContent = stats.images;
        if (totalVideos) totalVideos.textContent = stats.videos;
        if (totalSkills) totalSkills.textContent = stats.skills;
        if (totalPages) totalPages.textContent = stats.pages;
    }

    updateContentForm() {
        const form = document.getElementById('contentForm');
        if (!form || !this.content) return;

        form.innerHTML = `
            <form id="siteContentForm" class="content-form">
                <div class="form-section">
                    <h3>Thông tin cơ bản</h3>
                    <div class="form-group">
                        <label for="siteTitle">Tiêu đề website</label>
                        <input type="text" id="siteTitle" value="${this.content.site.title}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="siteDescription">Mô tả</label>
                        <textarea id="siteDescription" class="form-control" rows="3">${this.content.site.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="siteQuote">Quote</label>
                        <textarea id="siteQuote" class="form-control" rows="2">${this.content.site.quote}</textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Thông tin liên hệ</h3>
                    <div class="form-group">
                        <label for="sitePhone">Số điện thoại</label>
                        <input type="text" id="sitePhone" value="${this.content.site.phone}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="siteEmail">Email</label>
                        <input type="email" id="siteEmail" value="${this.content.site.email}" class="form-control">
                    </div>
                </div>

                <div class="form-section">
                    <h3>Mạng xã hội</h3>
                    <div class="form-group">
                        <label for="siteFacebook">Facebook</label>
                        <input type="url" id="siteFacebook" value="${this.content.site.social.facebook}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="siteInstagram">Instagram</label>
                        <input type="url" id="siteInstagram" value="${this.content.site.social.instagram}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="siteYoutube">YouTube</label>
                        <input type="url" id="siteYoutube" value="${this.content.site.social.youtube}" class="form-control">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Lưu thay đổi
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="contentManager.previewChanges()">
                        <i class="fas fa-eye"></i> Xem trước
                    </button>
                </div>
            </form>
        `;

        // Bind form submit
        const siteForm = document.getElementById('siteContentForm');
        if (siteForm) {
            siteForm.addEventListener('submit', (e) => this.handleContentSubmit(e));
        }
    }

    updateMediaForm() {
        const form = document.getElementById('mediaForm');
        if (!form || !this.content) return;

        form.innerHTML = `
            <div class="media-management">
                <div class="upload-section">
                    <h3>Thêm media mới</h3>
                    <form id="mediaUploadForm" class="media-form">
                        <div class="form-group">
                            <label for="mediaType">Loại media</label>
                            <select id="mediaType" class="form-control">
                                <option value="image">Ảnh</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="mediaFile">File</label>
                            <input type="file" id="mediaFile" class="form-control" accept="image/*,video/*">
                        </div>
                        <div class="form-group">
                            <label for="mediaName">Tên</label>
                            <input type="text" id="mediaName" class="form-control" placeholder="Tên media">
                        </div>
                        <div class="form-group">
                            <label for="mediaDescription">Mô tả</label>
                            <textarea id="mediaDescription" class="form-control" rows="2" placeholder="Mô tả media"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="mediaCategory">Danh mục</label>
                            <select id="mediaCategory" class="form-control">
                                <option value="portrait">Chân dung</option>
                                <option value="event">Sự kiện</option>
                                <option value="work">Công việc</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-upload"></i> Tải lên
                        </button>
                    </form>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--color-muted);">
                
                <div class="media-library">
                    <h3>Thư viện media</h3>
                    <div class="media-tabs">
                        <button class="tab-btn active" onclick="contentManager.showMediaTab('images')">Ảnh (${this.content.media.images.length})</button>
                        <button class="tab-btn" onclick="contentManager.showMediaTab('videos')">Video (${this.content.media.videos.length})</button>
                    </div>
                    <div id="mediaList" class="media-grid">
                        ${this.renderMediaList('images')}
                    </div>
                </div>
            </div>
        `;

        // Bind media form
        const mediaForm = document.getElementById('mediaUploadForm');
        if (mediaForm) {
            mediaForm.addEventListener('submit', (e) => this.handleMediaUpload(e));
        }
    }

    updateSkillsForm() {
        const form = document.getElementById('skillsForm');
        if (!form || !this.content) return;

        form.innerHTML = `
            <div class="skills-management">
                <div class="add-skill">
                    <h3>Thêm kỹ năng mới</h3>
                    <form id="skillForm" class="skill-form">
                        <div class="form-group">
                            <label for="skillName">Tên kỹ năng</label>
                            <input type="text" id="skillName" class="form-control" placeholder="VD: Dẫn chương trình">
                        </div>
                        <div class="form-group">
                            <label for="skillDescription">Mô tả</label>
                            <textarea id="skillDescription" class="form-control" rows="3" placeholder="Mô tả chi tiết kỹ năng"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="skillIcon">Icon (FontAwesome)</label>
                            <input type="text" id="skillIcon" class="form-control" placeholder="VD: fas fa-microphone">
                        </div>
                        <div class="form-group">
                            <label for="skillLevel">Mức độ</label>
                            <select id="skillLevel" class="form-control">
                                <option value="Tốt">Tốt</option>
                                <option value="Thành thạo">Thành thạo</option>
                                <option value="Chuyên nghiệp">Chuyên nghiệp</option>
                                <option value="Xuất sắc">Xuất sắc</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Thêm kỹ năng
                        </button>
                    </form>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--color-muted);">
                
                <div class="existing-skills">
                    <h3>Kỹ năng hiện có</h3>
                    <div id="skillsList">
                        ${this.renderSkillsList()}
                    </div>
                </div>
            </div>
        `;

        // Bind skill form
        const skillForm = document.getElementById('skillForm');
        if (skillForm) {
            skillForm.addEventListener('submit', (e) => this.handleSkillAdd(e));
        }
    }

    renderMediaList(type) {
        const media = this.content.media[type] || [];
        
        if (media.length === 0) {
            return '<p style="color: var(--color-muted); text-align: center;">Chưa có media nào</p>';
        }

        return media.map(item => `
            <div class="media-item" data-id="${item.id}" data-type="${type}">
                <div class="media-preview">
                    ${type === 'image' 
                        ? `<img src="/img/${item.filename}" alt="${item.name}" class="media-thumbnail">`
                        : `<div class="video-thumbnail"><i class="fas fa-play"></i></div>`
                    }
                </div>
                <div class="media-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <small>${item.category} • ${item.uploadDate}</small>
                </div>
                <div class="media-actions">
                    <button class="btn btn-sm btn-primary" onclick="contentManager.editMedia(${item.id}, '${type}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="contentManager.deleteMedia(${item.id}, '${type}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderSkillsList() {
        const skills = this.content.skills || [];
        
        if (skills.length === 0) {
            return '<p style="color: var(--color-muted); text-align: center;">Chưa có kỹ năng nào</p>';
        }

        return skills.map(skill => `
            <div class="skill-item" data-id="${skill.id}">
                <div class="skill-icon">
                    <i class="${skill.icon}"></i>
                </div>
                <div class="skill-info">
                    <h4>${skill.name}</h4>
                    <p>${skill.description}</p>
                    <span class="skill-level">${skill.level}</span>
                </div>
                <div class="skill-actions">
                    <button class="btn btn-sm btn-primary" onclick="contentManager.editSkill(${skill.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="contentManager.deleteSkill(${skill.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    showMediaTab(type) {
        const mediaList = document.getElementById('mediaList');
        if (mediaList) {
            mediaList.innerHTML = this.renderMediaList(type);
        }

        // Update active tab
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
    }

    async handleContentSubmit(e) {
        e.preventDefault();
        
        try {
            const updatedContent = {
                site: {
                    title: document.getElementById('siteTitle').value,
                    description: document.getElementById('siteDescription').value,
                    quote: document.getElementById('siteQuote').value,
                    phone: document.getElementById('sitePhone').value,
                    email: document.getElementById('siteEmail').value,
                    social: {
                        facebook: document.getElementById('siteFacebook').value,
                        instagram: document.getElementById('siteInstagram').value,
                        youtube: document.getElementById('siteYoutube').value
                    }
                }
            };

            // Update content
            Object.assign(this.content.site, updatedContent.site);
            
            // Save to file
            await this.saveContent();
            
            this.showNotification('Đã cập nhật thông tin website!', 'success');
        } catch (error) {
            console.error('Error updating content:', error);
            this.showNotification('Có lỗi xảy ra khi cập nhật!', 'error');
        }
    }

    async handleMediaUpload(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('mediaFile');
        const file = fileInput.files[0];
        const type = document.getElementById('mediaType').value;
        const name = document.getElementById('mediaName').value;
        const description = document.getElementById('mediaDescription').value;
        const category = document.getElementById('mediaCategory').value;

        if (!file || !name || !description) {
            this.showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        try {
            // Create media item
            const mediaItem = {
                id: Date.now(),
                name: name,
                filename: file.name,
                description: description,
                category: category,
                uploadDate: new Date().toISOString().split('T')[0]
            };

            // Add to content
            this.content.media[type === 'image' ? 'images' : 'videos'].push(mediaItem);
            
            // Save content
            await this.saveContent();
            
            // Update UI
            this.updateMediaForm();
            this.updateStats();
            
            this.showNotification('Đã thêm media thành công!', 'success');
            
            // Reset form
            e.target.reset();
        } catch (error) {
            console.error('Error uploading media:', error);
            this.showNotification('Có lỗi xảy ra khi tải lên!', 'error');
        }
    }

    async handleSkillAdd(e) {
        e.preventDefault();
        
        const name = document.getElementById('skillName').value;
        const description = document.getElementById('skillDescription').value;
        const icon = document.getElementById('skillIcon').value;
        const level = document.getElementById('skillLevel').value;

        if (!name || !description || !icon) {
            this.showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        try {
            // Create skill
            const skill = {
                id: Date.now(),
                name: name,
                description: description,
                icon: icon,
                level: level
            };

            // Add to content
            this.content.skills.push(skill);
            
            // Save content
            await this.saveContent();
            
            // Update UI
            this.updateSkillsForm();
            this.updateStats();
            
            this.showNotification('Đã thêm kỹ năng thành công!', 'success');
            
            // Reset form
            e.target.reset();
        } catch (error) {
            console.error('Error adding skill:', error);
            this.showNotification('Có lỗi xảy ra khi thêm kỹ năng!', 'error');
        }
    }

    async saveContent() {
        try {
            // Save to localStorage for now
            localStorage.setItem('websiteContent', JSON.stringify(this.content));
            
            // Try to save to file via API
            const response = await fetch('/api/save-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.content)
            });
            
            if (response.ok) {
                console.log('Content saved successfully');
            } else {
                throw new Error('Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            // Fallback: download content file
            this.downloadContentFile();
        }
    }

    downloadContentFile() {
        try {
            const blob = new Blob([JSON.stringify(this.content, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'content.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('File content.json đã được tải về. Vui lòng copy vào thư mục admin/data/ và commit vào Git.', 'warning');
        } catch (error) {
            console.error('Error downloading content file:', error);
        }
    }

    editMedia(id, type) {
        this.showNotification('Tính năng chỉnh sửa media sẽ được cập nhật sớm!', 'info');
    }

    deleteMedia(id, type) {
        if (confirm('Bạn có chắc muốn xóa media này?')) {
            const mediaArray = this.content.media[type === 'image' ? 'images' : 'videos'];
            const index = mediaArray.findIndex(item => item.id === id);
            
            if (index > -1) {
                mediaArray.splice(index, 1);
                this.saveContent();
                this.updateMediaForm();
                this.updateStats();
                this.showNotification('Đã xóa media!', 'success');
            }
        }
    }

    editSkill(id) {
        this.showNotification('Tính năng chỉnh sửa kỹ năng sẽ được cập nhật sớm!', 'info');
    }

    deleteSkill(id) {
        if (confirm('Bạn có chắc muốn xóa kỹ năng này?')) {
            const index = this.content.skills.findIndex(skill => skill.id === id);
            
            if (index > -1) {
                this.content.skills.splice(index, 1);
                this.saveContent();
                this.updateSkillsForm();
                this.updateStats();
                this.showNotification('Đã xóa kỹ năng!', 'success');
            }
        }
    }

    previewChanges() {
        this.showNotification('Tính năng xem trước sẽ được cập nhật sớm!', 'info');
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
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
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

// Initialize content manager
const contentManager = new ContentManager();

