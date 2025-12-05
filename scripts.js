// Auth Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const authError = document.getElementById('auth-error');

// App Elements
const budgetInput = document.getElementById('budget');
const setBudgetBtn = document.getElementById('set-budget');
const currentBudgetDisplay = document.getElementById('current-budget');
const monthSelector = document.getElementById('month-selector');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const otherCategoryInput = document.getElementById('other-category');
const expenseDateInput = document.getElementById('expense-date');
const addExpenseBtn = document.getElementById('add-expense');
const editSection = document.getElementById('edit-section');
const editAmount = document.getElementById('edit-amount');
const editCategory = document.getElementById('edit-category');
const editOtherCategoryInput = document.getElementById('edit-other-category');
const editExpenseDateInput = document.getElementById('edit-expense-date');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const totalSpentDisplay = document.getElementById('total-spent');
const remainingBudgetDisplay = document.getElementById('remaining-budget');
const downloadCsvBtn = document.getElementById('download-csv');
const downloadExcelBtn = document.getElementById('download-excel');
const monthReportsList = document.getElementById('month-reports-list');
const categoryList = document.getElementById('category-list');
const dailyList = document.getElementById('daily-list');
const expenseList = document.getElementById('expense-list');

// Data
let currentUser = null;
let budget = 0;
let expenses = [];
let editingExpense = null;

// Initialize
checkAuthState();

// Auth Functions
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
        await loadData();
    } else {
        showAuth();
    }
}

function showAuth() {
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
}

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;
}

async function loadData() {
    await loadBudget();
    await loadExpenses();
    updateDisplay();
}

async function loadBudget() {
    const { data, error } = await supabase.from('budgets').select('amount').single();
    if (error && error.code !== 'PGRST116') {
        console.error(error);
        return;
    }
    budget = data ? parseFloat(data.amount) : 0;
}

async function loadExpenses() {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
    if (error) {
        console.error(error);
        return;
    }
    expenses = data || [];
}

// Event Listeners
signInBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        authError.textContent = error.message;
    } else {
        await checkAuthState();
    }
});

signUpBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        authError.textContent = error.message;
    } else {
        authError.textContent = 'Sign up successful! Please check your email for confirmation.';
    }
});

setBudgetBtn.addEventListener('click', async () => {
    const newBudget = parseFloat(budgetInput.value);
    if (newBudget > 0) {
        // Check if budget already exists
        const { data: existingBudget } = await supabase
            .from('budgets')
            .select('id')
            .eq('user_id', currentUser.id)
            .single();

        let error;
        if (existingBudget) {
            // Update existing budget
            const result = await supabase
                .from('budgets')
                .update({ amount: newBudget })
                .eq('user_id', currentUser.id);
            error = result.error;
        } else {
            // Insert new budget
            const result = await supabase
                .from('budgets')
                .insert({ user_id: currentUser.id, amount: newBudget });
            error = result.error;
        }

        if (error) {
            alert('Error setting budget: ' + error.message);
            return;
        }
        budget = newBudget;
        budgetInput.value = '';
        updateDisplay();
    } else {
        alert('Please enter a valid budget amount.');
    }
});

addExpenseBtn.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    const category = getCategoryValue(categorySelect, otherCategoryInput);
    const selectedDate = expenseDateInput.value;
    if (amount > 0) {
        if (category === 'other' || !categorySelect.value) {
            alert('Please select a category.');
            return;
        }
        const { data, error } = await supabase
            .from('expenses')
            .insert({
                user_id: currentUser.id,
                amount: amount,
                category: category,
                date: new Date(selectedDate).toISOString()
            })
            .select()
            .single();
        if (error) {
            alert('Error adding expense: ' + error.message);
            return;
        }
        expenses.unshift(data);
        amountInput.value = '';
        otherCategoryInput.value = '';
        // Reset to today for next entry
        const today = new Date().toISOString().split('T')[0];
        expenseDateInput.value = today;
        updateDisplay();
    } else {
        alert('Please enter a valid amount.');
    }
});

saveEditBtn.addEventListener('click', async () => {
    const amount = parseFloat(editAmount.value);
    if (amount > 0 && editingExpense) {
        const category = getCategoryValue(editCategory, editOtherCategoryInput);
        if (category === 'other' || !editCategory.value) {
            alert('Please select a category.');
            return;
        }
        const { error } = await supabase
            .from('expenses')
            .update({
                amount: amount,
                category: category,
                date: new Date(editExpenseDateInput.value).toISOString()
            })
            .eq('id', editingExpense.id);
        if (error) {
            alert('Error updating expense: ' + error.message);
            return;
        }
        editingExpense.amount = amount;
        editingExpense.category = category;
        editingExpense.date = new Date(editExpenseDateInput.value).toISOString();
        editSection.style.display = 'none';
        editingExpense = null;
        updateDisplay();
    } else {
        alert('Please enter a valid amount.');
    }
});

cancelEditBtn.addEventListener('click', () => {
    editSection.style.display = 'none';
    editingExpense = null;
});

monthSelector.addEventListener('change', updateDisplay);

categorySelect.addEventListener('change', () => {
    toggleOtherCategoryInput();
});

editCategory.addEventListener('change', () => {
    toggleEditOtherCategoryInput();
});

expenseList.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('edit-btn')) {
        editExpense(target.dataset.id);
    } else if (target.classList.contains('delete-btn')) {
        await deleteExpense(target.dataset.id);
    }
});

// CRUD Functions
function editExpense(id) {
    const expense = expenses.find(e => e.id == id);
    if (!expense) return;
    editingExpense = expense;
    editAmount.value = expense.amount;
    setCategoryValue(editCategory, editOtherCategoryInput, expense.category);
    editExpenseDateInput.value = new Date(expense.date).toISOString().split('T')[0];
    editSection.style.display = 'block';
}

async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) {
            alert('Error deleting expense: ' + error.message);
            return;
        }
        expenses = expenses.filter(e => e.id != id);
        updateDisplay();
    }
}

// Utility Functions
function calculateTotals(filteredExpenses) {
    const totals = { food: 0, travel: 0, other: 0 };
    let totalSpent = 0;
    filteredExpenses.forEach(expense => {
        totals[expense.category] += expense.amount;
        totalSpent += expense.amount;
    });
    return { totals, totalSpent };
}

function calculateDailyTotals(filteredExpenses) {
    const daily = {};
    filteredExpenses.forEach(expense => {
        const displayDate = new Date(expense.date).toLocaleDateString();
        if (!daily[displayDate]) daily[displayDate] = 0;
        daily[displayDate] += expense.amount;
    });
    return Object.entries(daily).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

function getFilteredExpenses() {
    const selectedMonth = monthSelector.value;
    if (!selectedMonth) return expenses;
    const [year, month] = selectedMonth.split('-');
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === parseInt(year) && expenseDate.getMonth() + 1 === parseInt(month);
    });
}

downloadCsvBtn.addEventListener('click', () => downloadMonthlyReport('csv'));
downloadExcelBtn.addEventListener('click', () => downloadMonthlyReport('excel'));

monthReportsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('month-download-btn')) {
        const month = e.target.dataset.month;
        downloadMonthlyReportForMonth(month, 'csv'); // Default to CSV for individual month buttons
    }
});

function updateDisplay() {
    const filteredExpenses = getFilteredExpenses();

    currentBudgetDisplay.textContent = `Current Budget: ₹${budget.toFixed(2)}`;

    const { totals, totalSpent } = calculateTotals(filteredExpenses);

    totalSpentDisplay.textContent = `Total Spent: ₹${totalSpent.toFixed(2)}`;
    remainingBudgetDisplay.textContent = `Remaining Budget: ₹${(budget - totalSpent).toFixed(2)}`;

    categoryList.innerHTML = `
        <li>Food: ₹${totals.food.toFixed(2)}</li>
        <li>Travel: ₹${totals.travel.toFixed(2)}</li>
        <li>Other: ₹${totals.other.toFixed(2)}</li>
    `;

    const dailyTotals = calculateDailyTotals(filteredExpenses);
    dailyList.innerHTML = dailyTotals.map(([date, total]) => `<li>${date}: ₹${total.toFixed(2)}</li>`).join('');

    expenseList.innerHTML = '';
    filteredExpenses.slice(-10).reverse().forEach(expense => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
            <div class="expense-info">₹${expense.amount.toFixed(2)} - ${getDisplayCategory(expense.category)} - ${new Date(expense.date).toLocaleDateString()}</div>
            <div class="expense-actions">
                <button class="edit-btn" data-id="${expense.id}">Edit</button>
                <button class="delete-btn" data-id="${expense.id}">Delete</button>
            </div>
        `;
        expenseList.appendChild(li);
    });

    // Update month reports list
    updateMonthReportsList();
}

function getAllMonths() {
    const months = new Set();
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
    });
    return Array.from(months).sort().reverse(); // Most recent first
}

function updateMonthReportsList() {
    const months = getAllMonths();
    monthReportsList.innerHTML = months.map(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        return `<button class="month-download-btn" data-month="${month}">Download ${monthName} Report</button>`;
    }).join('');
}

function downloadMonthlyReport(format) {
    const selectedMonth = monthSelector.value;
    downloadMonthlyReportForMonth(selectedMonth, format);
}

function downloadMonthlyReportForMonth(monthStr, format = 'csv') {
    if (!monthStr) return;

    const [year, month] = monthStr.split('-');
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === parseInt(year) && expenseDate.getMonth() + 1 === parseInt(month);
    });

    if (filteredExpenses.length === 0) {
        alert('No expenses found for this month.');
        return;
    }

    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    if (format === 'csv') {
        downloadCSV(filteredExpenses, monthName);
    } else if (format === 'excel') {
        downloadExcel(filteredExpenses, monthName);
    }
}

function downloadCSV(expenses, monthName) {
    // Format data for CSV
    const csvHeader = 'Date,Amount,Category\n';
    const csvData = expenses.map(expense => {
        const date = new Date(expense.date).toLocaleDateString();
        const amount = expense.amount.toFixed(2);
        const category = getDisplayCategory(expense.category);
        return `${date},${amount},${category}`;
    }).join('\n');

    const csvContent = csvHeader + csvData;

    // Create and download the file
    const filename = `expense_report_${monthName.replace(' ', '_')}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function downloadExcel(expenses, monthName) {
    // Prepare data for Excel
    const data = expenses.map(expense => ({
        Date: new Date(expense.date).toLocaleDateString(),
        Amount: parseFloat(expense.amount.toFixed(2)),
        Category: getDisplayCategory(expense.category)
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    // Generate Excel file
    XLSX.writeFile(workbook, `expense_report_${monthName.replace(' ', '_')}.xlsx`);
}

// Category toggle functions
function toggleOtherCategoryInput() {
    if (categorySelect.value === 'other') {
        otherCategoryInput.style.display = 'block';
    } else {
        otherCategoryInput.style.display = 'none';
        otherCategoryInput.value = '';
    }
}

function toggleEditOtherCategoryInput() {
    if (editCategory.value === 'other') {
        editOtherCategoryInput.style.display = 'block';
    } else {
        editOtherCategoryInput.style.display = 'none';
        editOtherCategoryInput.value = '';
    }
}

// Predefined categories that appear in the select dropdown
const PREDEFINED_CATEGORIES = ['food', 'travel'];

// Get category value with custom logic
function getCategoryValue(selectElement, textInput) {
    if (selectElement.value === 'other') {
        const customCategory = textInput.value.trim();
        return customCategory || 'other';
    }
    return selectElement.value;
}

// Get display category from stored value
function getDisplayCategory(category) {
    // Capitalize first letter
    return category.charAt(0).toUpperCase() + category.slice(1);
}

// Set category value in select and text input
function setCategoryValue(selectElement, textInput, category) {
    const lowerCategory = category.toLowerCase();

    // Check if it's a predefined category
    if (PREDEFINED_CATEGORIES.includes(lowerCategory)) {
        selectElement.value = lowerCategory;
        textInput.value = '';
        textInput.style.display = 'none';
    } else if (lowerCategory === 'other' || !category.trim()) {
        // If category is 'other' or empty, show empty 'other' input
        selectElement.value = 'other';
        textInput.value = '';
        textInput.style.display = 'block';
    } else {
        // It's a custom category, so set it as 'other' with the custom value
        selectElement.value = 'other';
        textInput.value = category;
        textInput.style.display = 'block';
    }
}
