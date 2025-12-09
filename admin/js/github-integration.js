// GitHub Integration - Tự động commit và push thay đổi
class GitHubIntegration {
    constructor() {
        this.config = {
            owner: 'your-username',
            repo: 'hoangphuc',
            branch: 'main',
            token: null
        };
        this.init();
    }

    init() {
        this.loadConfig();
        this.bindEvents();
    }

    loadConfig() {
        // Load config from localStorage or prompt user
        const savedConfig = localStorage.getItem('githubConfig');
        if (savedConfig) {
            this.config = { ...this.config, ...JSON.parse(savedConfig) };
        } else {
            this.promptGitHubConfig();
        }
    }

    promptGitHubConfig() {
        const config = prompt(`
Vui lòng cấu hình GitHub:
1. Username: ${this.config.owner}
2. Repository: ${this.config.repo}
3. Branch: ${this.config.branch}
4. Personal Access Token: (nhập token của bạn)

Format: username,repo,branch,token
        `);

        if (config) {
            const [owner, repo, branch, token] = config.split(',');
            this.config = { owner, repo, branch, token };
            localStorage.setItem('githubConfig', JSON.stringify(this.config));
        }
    }

    bindEvents() {
        // Add GitHub integration button to admin panel
        document.addEventListener('DOMContentLoaded', () => {
            this.addGitHubButton();
        });
    }

    addGitHubButton() {
        const header = document.querySelector('.header-content');
        if (header) {
            const gitHubBtn = document.createElement('button');
            gitHubBtn.className = 'btn btn-secondary';
            gitHubBtn.innerHTML = '<i class="fab fa-github"></i> GitHub';
            gitHubBtn.onclick = () => this.openGitHubModal();
            
            header.appendChild(gitHubBtn);
        }
    }

    openGitHubModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>GitHub Integration</h2>
                    <button class="close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="github-status">
                        <h3>Trạng thái kết nối</h3>
                        <p>Repository: ${this.config.owner}/${this.config.repo}</p>
                        <p>Branch: ${this.config.branch}</p>
                        <p>Token: ${this.config.token ? '✓ Đã cấu hình' : '✗ Chưa cấu hình'}</p>
                    </div>
                    
                    <div class="github-actions">
                        <h3>Thao tác</h3>
                        <button class="btn btn-primary" onclick="githubIntegration.commitAndPush()">
                            <i class="fas fa-upload"></i> Commit & Push
                        </button>
                        <button class="btn btn-secondary" onclick="githubIntegration.pullLatest()">
                            <i class="fas fa-download"></i> Pull Latest
                        </button>
                        <button class="btn btn-warning" onclick="githubIntegration.promptGitHubConfig()">
                            <i class="fas fa-cog"></i> Cấu hình lại
                        </button>
                    </div>
                    
                    <div class="github-log">
                        <h3>Lịch sử hoạt động</h3>
                        <div id="githubLog" class="log-content">
                            <p>Chưa có hoạt động nào</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async commitAndPush() {
        if (!this.config.token) {
            this.showNotification('Vui lòng cấu hình GitHub token trước!', 'error');
            return;
        }

        try {
            this.logActivity('Bắt đầu commit và push...');
            
            // Get current content
            const content = JSON.parse(localStorage.getItem('websiteContent'));
            if (!content) {
                throw new Error('Không có nội dung để commit');
            }

            // Create commit message
            const commitMessage = `Update website content - ${new Date().toLocaleString('vi-VN')}`;
            
            // Update content.json file
            await this.updateFile('admin/data/content.json', JSON.stringify(content, null, 2), commitMessage);
            
            this.logActivity('Đã commit thành công!');
            this.showNotification('Đã cập nhật GitHub thành công!', 'success');
            
        } catch (error) {
            console.error('Error committing to GitHub:', error);
            this.logActivity(`Lỗi: ${error.message}`);
            this.showNotification('Có lỗi xảy ra khi commit!', 'error');
        }
    }

    async updateFile(path, content, message) {
        try {
            // Get current file SHA
            const fileInfo = await this.getFileInfo(path);
            
            // Create blob
            const blob = await this.createBlob(content);
            
            // Create tree
            const tree = await this.createTree([{
                path: path,
                mode: '100644',
                type: 'blob',
                sha: blob.sha
            }]);
            
            // Create commit
            const commit = await this.createCommit(message, tree.sha, fileInfo ? fileInfo.sha : null);
            
            // Update reference
            await this.updateReference(commit.sha);
            
        } catch (error) {
            throw new Error(`Không thể cập nhật file: ${error.message}`);
        }
    }

    async getFileInfo(path) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }

    async createBlob(content) {
        const response = await fetch(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/blobs`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: btoa(content),
                    encoding: 'base64'
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Không thể tạo blob');
        }
        
        return await response.json();
    }

    async createTree(items) {
        const response = await fetch(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/trees`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tree: items
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Không thể tạo tree');
        }
        
        return await response.json();
    }

    async createCommit(message, treeSha, parentSha) {
        const commitData = {
            message: message,
            tree: treeSha
        };
        
        if (parentSha) {
            commitData.parents = [parentSha];
        }
        
        const response = await fetch(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitData)
            }
        );
        
        if (!response.ok) {
            throw new Error('Không thể tạo commit');
        }
        
        return await response.json();
    }

    async updateReference(commitSha) {
        const response = await fetch(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sha: commitSha
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Không thể cập nhật reference');
        }
        
        return await response.json();
    }

    async pullLatest() {
        try {
            this.logActivity('Đang kéo thay đổi mới nhất...');
            
            // Get latest content from GitHub
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/admin/data/content.json`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const fileData = await response.json();
                const content = JSON.parse(atob(fileData.content));
                
                // Update localStorage
                localStorage.setItem('websiteContent', JSON.stringify(content));
                
                // Reload content manager
                if (window.contentManager) {
                    contentManager.content = content;
                    contentManager.updateUI();
                }
                
                this.logActivity('Đã cập nhật nội dung mới nhất!');
                this.showNotification('Đã cập nhật nội dung mới nhất!', 'success');
            } else {
                throw new Error('Không thể tải nội dung từ GitHub');
            }
            
        } catch (error) {
            console.error('Error pulling latest:', error);
            this.logActivity(`Lỗi: ${error.message}`);
            this.showNotification('Có lỗi xảy ra khi cập nhật!', 'error');
        }
    }

    logActivity(message) {
        const logElement = document.getElementById('githubLog');
        if (logElement) {
            const timestamp = new Date().toLocaleString('vi-VN');
            const logEntry = document.createElement('p');
            logEntry.innerHTML = `<small>${timestamp}</small> ${message}`;
            logElement.appendChild(logEntry);
            logElement.scrollTop = logElement.scrollHeight;
        }
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

// Initialize GitHub integration
const githubIntegration = new GitHubIntegration();
