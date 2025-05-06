<script>
    // Application State
    const AppState = {
      token: localStorage.getItem('revenueToken') || '',
      currentUser: null,
      selectedService: null,
      currentPage: 1,
      itemsPerPage: 5,
      allTransactions: []
    };

    // DOM Elements
    const DOM = {
      authSection: document.getElementById('authSection'),
      mainContent: document.getElementById('mainContent'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      logoutLink: document.getElementById('logoutLink'),
      dashboardSection: document.getElementById('dashboardSection'),
      servicesSection: document.getElementById('servicesSection'),
      paymentSection: document.getElementById('paymentSection'),
      historySection: document.getElementById('historySection'),
      servicesContainer: document.getElementById('servicesContainer'),
      modalServicesContainer: document.getElementById('modalServicesContainer'),
      selectedServiceCard: document.getElementById('selectedServiceCard'),
      selectedServiceName: document.getElementById('selectedServiceName'),
      selectedServiceDescription: document.getElementById('selectedServiceDescription'),
      selectedServiceAmount: document.getElementById('selectedServiceAmount'),
      selectServiceBtn: document.getElementById('selectServiceBtn'),
      paymentAmount: document.getElementById('paymentAmount'),
      paymentMethod: document.getElementById('paymentMethod'),
      mobileMoneyFields: document.getElementById('mobileMoneyFields'),
      mobileMoneyInstructions: document.getElementById('mobileMoneyInstructions'),
      cardInstructions: document.getElementById('cardInstructions'),
      bankInstructions: document.getElementById('bankInstructions'),
      transactionsTable: document.getElementById('transactionsTable'),
      pagination: document.getElementById('pagination'),
      searchTransactions: document.getElementById('searchTransactions'),
      totalPayments: document.getElementById('totalPayments'),
      completedPayments: document.getElementById('completedPayments'),
      pendingPayments: document.getElementById('pendingPayments'),
      receiptContent: document.getElementById('receiptContent'),
      loginForm: document.getElementById('loginForm'),
      signupForm: document.getElementById('signupForm'),
      signupRole: document.getElementById('signupRole'),
      idFieldContainer: document.getElementById('idFieldContainer'),
      paymentForm: document.getElementById('paymentForm'),
      toastContainer: document.querySelector('.toast-container')
    };

    // Initialize Application
    document.addEventListener('DOMContentLoaded', () => {
      initializeAuthTabs();
      setupEventListeners();
      checkAuthStatus();
    });

    function initializeAuthTabs() {
      const authTabs = new bootstrap.Tab(document.getElementById('login-tab'));
      authTabs.show();
    }

    function setupEventListeners() {
      // Auth forms
      DOM.loginForm.addEventListener('submit', handleLogin);
      DOM.signupForm.addEventListener('submit', handleSignup);
      DOM.signupRole.addEventListener('change', updateIdField);
      
      // Navigation
      document.getElementById('homeLink').addEventListener('click', showDashboard);
      document.getElementById('servicesLink').addEventListener('click', showServices);
      document.getElementById('paymentsLink').addEventListener('click', showPaymentSection);
      document.getElementById('historyLink').addEventListener('click', showHistory);
      DOM.logoutLink.addEventListener('click', handleLogout);
      
      // Payment form
      DOM.paymentForm.addEventListener('submit', processPayment);
      DOM.paymentMethod.addEventListener('change', showPaymentInstructions);
      DOM.selectServiceBtn.addEventListener('click', showServiceModal);
      
      // Search
      document.getElementById('searchBtn').addEventListener('click', searchTransactions);
      DOM.searchTransactions.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchTransactions();
      });
      
      // Print receipt
      document.getElementById('printReceiptBtn').addEventListener('click', printReceipt);
    }

    // Auth Functions
    async function checkAuthStatus() {
      if (AppState.token) {
        await fetchCurrentUser();
      }
    }

    async function fetchCurrentUser() {
      try {
        showLoading(true);
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${AppState.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          AppState.currentUser = data.data;
          showMainContent();
          showDashboard();
          updateDashboardStats();
        } else {
          localStorage.removeItem('revenueToken');
          showToast('Session expired. Please login again.', 'warning');
          showAuthSection();
        }
      } catch (error) {
        showToast('Error fetching user data', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      try {
        showLoading(true);
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          AppState.token = data.token;
          localStorage.setItem('revenueToken', AppState.token);
          AppState.currentUser = data.user;
          showMainContent();
          showDashboard();
          updateDashboardStats();
          showToast('Login successful!', 'success');
        } else {
          showToast(data.message || 'Login failed', 'danger');
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    async function handleSignup(e) {
      e.preventDefault();
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const role = document.getElementById('signupRole').value;
      
      const payload = { 
        email, 
        password, 
        role,
        ...(role === 'citizen' && { nationalId: document.getElementById('nationalId').value }),
        ...(role === 'business' && { businessRegNumber: document.getElementById('businessRegNumber').value })
      };
      
      try {
        showLoading(true);
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showToast('Account created successfully! Please login.', 'success');
          const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
          loginTab.show();
          document.getElementById('loginEmail').value = email;
          document.getElementById('loginPassword').value = '';
        } else {
          showToast(data.message || 'Signup failed', 'danger');
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    function updateIdField() {
      const role = DOM.signupRole.value;
      let html = '';
      
      if (role === 'citizen') {
        html = `
          <label for="nationalId" class="form-label">National ID</label>
          <input type="text" class="form-control" id="nationalId" required
                 pattern="[0-9]{8,12}" title="8-12 digit national ID">
        `;
      } else if (role === 'business') {
        html = `
          <label for="businessRegNumber" class="form-label">Business Registration Number</label>
          <input type="text" class="form-control" id="businessRegNumber" required
                 pattern="[A-Za-z0-9]{6,15}" title="6-15 character alphanumeric ID">
        `;
      }
      
      DOM.idFieldContainer.innerHTML = html;
    }

    // UI Navigation Functions
    function showAuthSection() {
      DOM.authSection.style.display = 'block';
      DOM.mainContent.style.display = 'none';
      DOM.logoutLink.style.display = 'none';
    }

    function showMainContent() {
      DOM.authSection.style.display = 'none';
      DOM.mainContent.style.display = 'block';
      DOM.logoutLink.style.display = 'block';
    }

    function showDashboard() {
      hideAllSections();
      DOM.dashboardSection.style.display = 'block';
      updateDashboardStats();
    }

    function showServices() {
      hideAllSections();
      DOM.servicesSection.style.display = 'block';
      fetchServices();
    }

    function showPaymentSection() {
      hideAllSections();
      DOM.paymentSection.style.display = 'block';
    }

    function showHistory() {
      hideAllSections();
      DOM.historySection.style.display = 'block';
      fetchTransactions();
    }

    function hideAllSections() {
      DOM.dashboardSection.style.display = 'none';
      DOM.servicesSection.style.display = 'none';
      DOM.paymentSection.style.display = 'none';
      DOM.historySection.style.display = 'none';
    }

    // Service Functions
    async function fetchServices() {
      try {
        showLoading(true);
        const response = await fetch('/api/services', {
          headers: {
            'Authorization': `Bearer ${AppState.token}`
          }
        });
        
        if (response.ok) {
          const services = await response.json();
          renderServices(services.data);
        } else {
          showToast('Error fetching services', 'danger');
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    function renderServices(services) {
      DOM.servicesContainer.innerHTML = services.map(service => `
        <div class="col-md-4 mb-4">
          <div class="card h-100 service-card" data-id="${service._id}">
            <div class="card-body">
              <h5 class="card-title">${service.name}</h5>
              <p class="card-text text-muted">${service.description || 'No description'}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-primary">${service.category}</span>
                <h5 class="mb-0">KES ${service.amount.toLocaleString()}</h5>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }

    function showServiceModal() {
      const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
      
      if (DOM.modalServicesContainer.children.length === 0) {
        fetchServicesForModal();
      }
      
      modal.show();
    }

    async function fetchServicesForModal() {
      try {
        showLoading(true);
        const response = await fetch('/api/services', {
          headers: {
            'Authorization': `Bearer ${AppState.token}`
          }
        });
        
        if (response.ok) {
          const services = await response.json();
          renderModalServices(services.data);
        } else {
          showToast('Error fetching services', 'danger');
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    function renderModalServices(services) {
      DOM.modalServicesContainer.innerHTML = services.map(service => `
        <div class="col-md-6 mb-3">
          <div class="card h-100 service-card-modal" data-id="${service._id}">
            <div class="card-body">
              <h5 class="card-title">${service.name}</h5>
              <p class="card-text text-muted">${service.description || 'No description'}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-primary">${service.category}</span>
                <h5 class="mb-0">KES ${service.amount.toLocaleString()}</h5>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      
      document.querySelectorAll('.service-card-modal').forEach(card => {
        card.addEventListener('click', () => {
          const service = services.find(s => s._id === card.dataset.id);
          selectService(service);
        });
      });
    }

    function selectService(service) {
      AppState.selectedService = service;
      
      DOM.selectedServiceName.textContent = service.name;
      DOM.selectedServiceDescription.textContent = service.description || 'No description';
      DOM.selectedServiceAmount.textContent = `KES ${service.amount.toLocaleString()}`;
      DOM.selectedServiceCard.style.display = 'block';
      DOM.paymentAmount.value = service.amount;
      DOM.selectServiceBtn.style.display = 'none';
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
      modal.hide();
    }

    // Payment Functions
    function showPaymentInstructions() {
      const method = DOM.paymentMethod.value;
      
      DOM.mobileMoneyInstructions.style.display = 'none';
      DOM.cardInstructions.style.display = 'none';
      DOM.bankInstructions.style.display = 'none';
      DOM.mobileMoneyFields.style.display = 'none';
      
      if (method === 'mobile_money') {
        DOM.mobileMoneyInstructions.style.display = 'block';
        DOM.mobileMoneyFields.style.display = 'block';
      } else if (method === 'card') {
        DOM.cardInstructions.style.display = 'block';
      } else if (method === 'bank_transfer') {
        DOM.bankInstructions.style.display = 'block';
      }
    }

    async function processPayment(e) {
      e.preventDefault();
      
      if (!AppState.selectedService) {
        showToast('Please select a service', 'warning');
        return;
      }
      
      const paymentData = {
        serviceId: AppState.selectedService._id,
        amount: parseFloat(DOM.paymentAmount.value),
        paymentMethod: DOM.paymentMethod.value,
        ...(DOM.paymentMethod.value === 'mobile_money' && { 
          phoneNumber: document.getElementById('phoneNumber').value 
        })
      };
      
      try {
        showLoading(true);
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AppState.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showToast('Payment processed successfully!', 'success');
          showReceipt(data.data);
          updateDashboardStats();
        } else {
          showToast(data.message || 'Payment failed', 'danger');
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    // Transaction Functions
    async function fetchTransactions() {
      try {
        showLoading(true);
        const response = await fetch('/api/payments/history', {
          headers: {
            'Authorization': `Bearer ${AppState.token}`
          }
        });
        
        if (response.ok) {
          const transactions = await response.json();
          AppState.allTransactions = transactions.data;
          renderTransactions(AppState.currentPage);
          setupPagination();
        } else {
          showToast('Error fetching transactions', 'danger');
        }
      } catch (error) {
        showToast('Network error. Please try again.', 'danger');
        console.error('Error:', error);
      } finally {
        showLoading(false);
      }
    }

    function renderTransactions(page) {
      const startIdx = (page - 1) * AppState.itemsPerPage;
      const endIdx = startIdx + AppState.itemsPerPage;
      const paginatedTransactions = AppState.allTransactions.slice(startIdx, endIdx);
      
      if (paginatedTransactions.length === 0) {
        DOM.transactionsTable.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4">No transactions found</td>
          </tr>
        `;
        return;
      }
      
      DOM.transactionsTable.innerHTML = paginatedTransactions.map(transaction => {
        const date = new Date(transaction.createdAt).toLocaleString();
        const statusClass = getStatusBadgeClass(transaction.status);
        
        return `
          <tr class="${transaction.status === 'failed' ? 'table-danger' : 
                      transaction.status === 'pending' ? 'table-warning' : ''}">
            <td>${date}</td>
            <td>${transaction.serviceId?.name || 'Unknown'}</td>
            <td>KES ${transaction.amount.toLocaleString()}</td>
            <td>${formatPaymentMethod(transaction.paymentMethod)}</td>
            <td><span class="badge ${statusClass}">${transaction.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline-primary view-receipt" data-id="${transaction._id}">
                <i class="bi bi-receipt"></i> View
              </button>
            </td>
          </tr>
        `;
      }).join('');
      
      document.querySelectorAll('.view-receipt').forEach(btn => {
        btn.addEventListener('click', () => {
          const transaction = AppState.allTransactions.find(t => t._id === btn.dataset.id);
          if (transaction) showReceipt(transaction);
        });
      });
    }

    function setupPagination() {
      const totalPages = Math.ceil(AppState.allTransactions.length / AppState.itemsPerPage);
      DOM.pagination.innerHTML = '';
      
      if (totalPages <= 1) return;
      
      // Previous button
      const prevLi = createPaginationItem(
        'Previous', 
        AppState.currentPage === 1, 
        () => navigateToPage(AppState.currentPage - 1)
      );
      DOM.pagination.appendChild(prevLi);
      
      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const pageLi = createPaginationItem(
          i, 
          i === AppState.currentPage, 
          () => navigateToPage(i)
        );
        DOM.pagination.appendChild(pageLi);
      }
      
      // Next button
      const nextLi = createPaginationItem(
        'Next', 
        AppState.currentPage === totalPages, 
        () => navigateToPage(AppState.currentPage + 1)
      );
      DOM.pagination.appendChild(nextLi);
    }

    function createPaginationItem(text, isDisabled, onClick) {
      const li = document.createElement('li');
      li.className = `page-item ${isDisabled ? 'disabled' : ''}`;
      li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
      li.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isDisabled) onClick();
      });
      return li;
    }

    function navigateToPage(page) {
      AppState.currentPage = page;
      renderTransactions(page);
      window.scrollTo(0, 0);
    }

    function searchTransactions() {
      const searchTerm = DOM.searchTransactions.value.toLowerCase();
      
      if (!searchTerm) {
        renderTransactions(AppState.currentPage);
        return;
      }
      
      const filtered = AppState.allTransactions.filter(t => 
        t.serviceId?.name.toLowerCase().includes(searchTerm) ||
        t.status.toLowerCase().includes(searchTerm) ||
        t.paymentMethod.toLowerCase().includes(searchTerm) ||
        t.amount.toString().includes(searchTerm)
      );
      
      const tempTransactions = [...AppState.allTransactions];
      AppState.allTransactions = filtered;
      AppState.currentPage = 1;
      renderTransactions(AppState.currentPage);
      setupPagination();
      AppState.allTransactions = tempTransactions;
    }

    function showReceipt(transaction) {
      const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
      const date = new Date(transaction.createdAt).toLocaleString();
      const statusClass = getStatusBadgeClass(transaction.status);
      
      DOM.receiptContent.innerHTML = `
        <div class="text-center mb-4">
          <h4>Mombasa County Government</h4>
          <p>Revenue Collection Receipt</p>
        </div>
        
        <div class="row mb-3">
          <div class="col-6">
            <strong>Receipt No:</strong> ${transaction.transactionId}
          </div>
          <div class="col-6 text-end">
            <strong>Date:</strong> ${date}
          </div>
        </div>
        
        <hr>
        
        <div class="mb-3">
          <strong>Service:</strong> ${transaction.serviceId?.name || 'Unknown'}
        </div>
        
        <div class="mb-3">
          <strong>Description:</strong> ${transaction.serviceId?.description || 'N/A'}
        </div>
        
        <div class="mb-3">
          <strong>Amount:</strong> KES ${transaction.amount.toLocaleString()}
        </div>
        
        <div class="mb-3">
          <strong>Payment Method:</strong> ${formatPaymentMethod(transaction.paymentMethod)}
        </div>
        
        <div class="mb-3">
          <strong>Status:</strong> <span class="badge ${statusClass}">
            ${transaction.status}
          </span>
        </div>
        
        <hr>
        
        <div class="text-center mt-4">
          <p>Thank you for your payment</p>
          <p>Mombasa County Government</p>
        </div>
      `;
      
      modal.show();
    }

    function printReceipt() {
      const receiptContent = DOM.receiptContent.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <div class="container mt-4">${receiptContent}</div>
        <script>
          window.print();
          setTimeout(() => {
            document.body.innerHTML = \`${originalContent.replace(/`/g, '\\`')}\`;
            window.location.reload();
          }, 1000);
        </script>
      `;
    }

    // Dashboard Functions
    async function updateDashboardStats() {
      try {
        const response = await fetch('/api/payments/history', {
          headers: {
            'Authorization': `Bearer ${AppState.token}`
          }
        });
        
        if (response.ok) {
          const transactions = await response.json();
          calculateStats(transactions.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    function calculateStats(transactions) {
      const totalPayments = transactions.reduce((sum, t) => sum + t.amount, 0);
      const completedCount = transactions.filter(t => t.status === 'completed').length;
      const pendingCount = transactions.filter(t => t.status === 'pending').length;
      
      DOM.totalPayments.textContent = `KES ${totalPayments.toLocaleString()}`;
      DOM.completedPayments.textContent = completedCount;
      DOM.pendingPayments.textContent = pendingCount;
    }

    // Utility Functions
    function handleLogout() {
      localStorage.removeItem('revenueToken');
      AppState.token = '';
      AppState.currentUser = null;
      showAuthSection();
      showToast('Logged out successfully', 'success');
      
      // Reset forms
      DOM.loginForm.reset();
      DOM.paymentForm.reset();
      DOM.selectedServiceCard.style.display = 'none';
      DOM.selectServiceBtn.style.display = 'block';
      AppState.selectedService = null;
    }

    function showLoading(show) {
      DOM.loadingSpinner.style.display = show ? 'block' : 'none';
    }

    function showToast(message, type = 'info') {
      const toastId = `toast-${Date.now()}`;
      const toast = document.createElement('div');
      toast.className = `toast show align-items-center text-white bg-${type} border-0`;
      toast.id = toastId;
      toast.role = 'alert';
      toast.setAttribute('aria-live', 'assertive');
      toast.setAttribute('aria-atomic', 'true');
      
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
      
      DOM.toastContainer.appendChild(toast);
      
      setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) toastElement.remove();
      }, 5000);
      
      toast.addEventListener('click', () => toast.remove());
    }

    function formatPaymentMethod(method) {
      const methods = {
        'mobile_money': 'Mobile Money',
        'card': 'Credit/Debit Card',
        'bank_transfer': 'Bank Transfer'
      };
      return methods[method] || method;
    }

    function getStatusBadgeClass(status) {
      const classes = {
        'completed': 'bg-success',
        'failed': 'bg-danger',
        'pending': 'bg-warning text-dark',
        'refunded': 'bg-info text-dark',
        'disputed': 'bg-secondary'
      };
      return classes[status] || 'bg-primary';
    }
  </script>