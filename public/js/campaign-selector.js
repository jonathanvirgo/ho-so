/**
 * Campaign Selector for Admin
 * Handles campaign switching functionality in sidebar
 */

class CampaignSelector {
    constructor() {
        this.selector = document.getElementById('campaignSelector');
        this.currentCampaignId = null;
        this.originalCampaignId = null;
        this.campaigns = [];
        
        if (this.selector) {
            this.init();
        }
    }

    async init() {
        try {
            // Load campaigns and set up event listeners
            await this.loadCampaigns();
            this.setupEventListeners();
            this.setCurrentCampaign();
        } catch (error) {
            console.error('Error initializing campaign selector:', error);
            this.showError('Không thể khởi tạo campaign selector');
        }
    }

    async loadCampaigns() {
        try {
            const response = await fetch('/admin/campaign/options', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success && result.data) {
                this.campaigns = result.data;
                this.populateSelector();
            } else {
                throw new Error(result.message || 'Không thể lấy danh sách campaign');
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
            this.showError('Không thể tải danh sách campaign');
        }
    }

    populateSelector() {
        // Clear existing options
        this.selector.innerHTML = '';

        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Chọn chiến dịch...';
        placeholderOption.disabled = true;
        this.selector.appendChild(placeholderOption);

        // Add campaign options
        this.campaigns.forEach(campaign => {
            const option = document.createElement('option');
            option.value = campaign.value;
            option.textContent = campaign.label;
            this.selector.appendChild(option);
        });
    }

    setCurrentCampaign() {
        // Get current campaign from user data (passed from server)
        if (typeof window.currentUser !== 'undefined' && window.currentUser) {
            this.currentCampaignId = window.currentUser.campaign_id;

            // Set selector value to current campaign
            if (this.currentCampaignId) {
                this.selector.value = this.currentCampaignId;
            } else {
                // If no campaign selected, show placeholder
                this.selector.value = '';
            }
        }
    }

    setupEventListeners() {
        this.selector.addEventListener('change', (event) => {
            this.handleCampaignChange(event.target.value);
        });
    }

    async handleCampaignChange(selectedCampaignId) {
        try {
            // Validate selection
            if (selectedCampaignId === '') {
                this.showError('Vui lòng chọn một chiến dịch');
                this.setCurrentCampaign(); // Revert to current value
                return;
            }

            // Show loading state
            this.setLoading(true);

            // Switch to selected campaign
            await this.switchToCampaign(selectedCampaignId);

        } catch (error) {
            console.error('Error handling campaign change:', error);
            this.showError('Không thể chuyển đổi campaign');
            // Revert selector to previous value
            this.setCurrentCampaign();
        } finally {
            this.setLoading(false);
        }
    }

    async switchToCampaign(campaignId) {
        const response = await fetch('/admin/campaign/switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                campaign_id: parseInt(campaignId)
            })
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            this.showSuccess(`Đã chuyển sang campaign: ${result.data.campaign_name}`);
            
            // Reload page after short delay to apply new campaign filter
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(result.message || 'Không thể chuyển đổi campaign');
        }
    }



    setLoading(isLoading) {
        this.selector.disabled = isLoading;
        if (isLoading) {
            this.selector.style.opacity = '0.6';
        } else {
            this.selector.style.opacity = '1';
        }
    }

    showSuccess(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: message,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: message
            });
        } else {
            alert('Lỗi: ' + message);
        }
    }
}

// Initialize campaign selector when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if user is admin and selector exists
    if (typeof window.currentUser !== 'undefined' && 
        window.currentUser && 
        window.currentUser.isAdmin && 
        document.getElementById('campaignSelector')) {
        
        new CampaignSelector();
    }
});
