// Initialize expenses array from localStorage or empty array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const expensesContainer = document.getElementById('expenses-container');
const totalExpenses = document.getElementById('total-expenses');
const todayAmount = document.getElementById('today-amount');
const monthAmount = document.getElementById('month-amount');
const searchInput = document.getElementById('search');
const exportBtn = document.getElementById('export-btn');
const monthFilter = document.getElementById('month-filter');
const yearFilter = document.getElementById('year-filter');
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const deleteAllBtn = document.getElementById('delete-all');

// Set today's date as default
dateInput.valueAsDate = new Date();

// Update statistics
function updateStatistics() {
    // Calculate total amount
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    totalExpenses.textContent = total.toFixed(2) + ' ريال';

    // Calculate today's expenses
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses
        .filter(expense => expense.date.split('T')[0] === today)
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    todayAmount.textContent = todayExpenses.toFixed(2);

    // Calculate this month's expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthExpenses = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    monthAmount.textContent = monthExpenses.toFixed(2);
}

// Filter expenses
function filterExpenses() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value;
    const selectedYear = yearFilter.value;

    return expenses.filter(expense => {
        const matchesSearch = expense.category.toLowerCase().includes(searchTerm) ||
                            expense.description.toLowerCase().includes(searchTerm);
        
        const expenseDate = new Date(expense.date);
        const matchesMonth = selectedMonth === 'all' || expenseDate.getMonth() + 1 === parseInt(selectedMonth);
        const matchesYear = expenseDate.getFullYear() === parseInt(selectedYear);

        return matchesSearch && matchesMonth && matchesYear;
    });
}

// Format date to show Gregorian date only
function formatDate(date) {
    moment.locale('ar-SA');
    return moment(date).format('YYYY/MM/DD');
}

// Display expenses
function displayExpenses() {
    const filteredExpenses = filterExpenses();
    expensesContainer.innerHTML = '';
    
    if (filteredExpenses.length === 0) {
        expensesContainer.innerHTML = '<p class="no-expenses">لا توجد مصاريف مسجلة</p>';
        return;
    }
    
    filteredExpenses.forEach((expense, index) => {
        const expenseDate = new Date(expense.date);
        const formattedDate = formatDate(expense.date);

        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-item';
        
        expenseElement.innerHTML = `
            <div class="expense-info">
                <div class="expense-amount">${parseFloat(expense.amount).toFixed(2)} ريال</div>
                <div class="expense-category">${expense.category} - ${formattedDate}</div>
                ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
            </div>
            <button class="delete-btn" onclick="deleteExpense(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        expensesContainer.appendChild(expenseElement);
    });
}

// Smart Alerts System
const smartAlerts = {
    // Check for unusual spending
    checkUnusualSpending(amount, category) {
        const categoryExpenses = expenses.filter(e => e.category === category);
        if (categoryExpenses.length > 0) {
            const average = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / categoryExpenses.length;
            if (parseFloat(amount) > average * 2) {
                this.showAlert(`تنبيه: هذا المصروف أعلى من معدل إنفاقك المعتاد في فئة ${category} بشكل ملحوظ`);
            }
        }
    },

    // Check for budget warnings
    checkBudgetWarnings() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });

        const totalMonthly = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        
        // Get monthly budget from settings or default to 5000
        const monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 5000;
        const warningThreshold = monthlyBudget * 0.8; // 80% of budget

        if (totalMonthly > warningThreshold) {
            this.showAlert(`تنبيه: لقد تجاوزت ${Math.round((totalMonthly/monthlyBudget) * 100)}% من ميزانيتك الشهرية`);
        }
    },

    // Show alert with animation
    showAlert(message) {
        const alertElement = document.createElement('div');
        alertElement.className = 'smart-alert';
        alertElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(alertElement);

        // Animate in
        setTimeout(() => alertElement.classList.add('show'), 100);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    }
};

// Add expense with smart alerts
function addExpense(amount, category, date, description) {
    // Check for unusual spending
    smartAlerts.checkUnusualSpending(amount, category);
    
    expenses.unshift({
        amount: amount,
        category: category,
        date: new Date(date).toISOString(),
        description: description
    });
    
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Update UI
    displayExpenses();
    updateStatistics();
    
    // Check budget after adding expense
    smartAlerts.checkBudgetWarnings();
}

// Delete expense
function deleteExpense(index) {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        expenses.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        // Update UI
        displayExpenses();
        updateStatistics();
    }
}

// Delete all expenses
function deleteAllExpenses() {
    if (confirm('هل أنت متأكد من أنك تريد حذف جميع السجلات؟')) {
        expenses = [];
        localStorage.removeItem('expenses');
        updateStatistics();
        displayExpenses();
    }
}

// Export expenses
function exportExpenses() {
    const filteredExpenses = filterExpenses();
    const csvContent = [
        'التاريخ,المبلغ,الفئة,الوصف',
        ...filteredExpenses.map(expense => {
            const date = new Date(expense.date).toLocaleDateString('ar-SA');
            return `${date},${expense.amount},${expense.category},${expense.description}`;
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `مصاريف_${new Date().toLocaleDateString('ar-SA')}.csv`;
    link.click();
}

// Theme Switcher
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.checked = savedTheme === 'dark';

// Theme toggle handler
themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Mobile Menu Handler
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    mainContent.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
}

// Handle window resize
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
    if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        if (window.innerWidth > 992) {
            sidebar.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    }
});

// Event Listeners
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = amountInput.value;
    const category = categorySelect.value;
    const date = dateInput.value;
    const description = descriptionInput.value;
    
    if (!amount || !category || !date) return;
    
    addExpense(amount, category, date, description);
    expenseForm.reset();
    dateInput.valueAsDate = new Date();
});

searchInput.addEventListener('input', displayExpenses);
monthFilter.addEventListener('change', displayExpenses);
yearFilter.addEventListener('change', displayExpenses);
exportBtn.addEventListener('click', exportExpenses);

if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', deleteAllExpenses);
}

// Initial display
displayExpenses();
updateStatistics();
