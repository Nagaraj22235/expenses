// Elements
const budgetInput = document.getElementById('budget');
const setBudgetBtn = document.getElementById('set-budget');
const currentBudgetDisplay = document.getElementById('current-budget');
const monthSelector = document.getElementById('month-selector');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const addExpenseBtn = document.getElementById('add-expense');
const editSection = document.getElementById('edit-section');
const editAmount = document.getElementById('edit-amount');
const editCategory = document.getElementById('edit-category');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const totalSpentDisplay = document.getElementById('total-spent');
const remainingBudgetDisplay = document.getElementById('remaining-budget');
const categoryList = document.getElementById('category-list');
const dailyList = document.getElementById('daily-list');
const expenseList = document.getElementById('expense-list');

// Data
let budget = parseFloat(localStorage.getItem('budget')) || 0;
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let editingIndex = -1;

// Initialize
updateDisplay();

// Ensure expenses have id and proper date format (migrate old data)
expenses = expenses.map(expense => ({
    id: expense.id || Date.now() + Math.random(),
    amount: expense.amount,
    category: expense.category,
    date: typeof expense.date === 'string' && expense.date.includes('T') ? expense.date : new Date(expense.date).toISOString()
}));

localStorage.setItem('expenses', JSON.stringify(expenses));

// Get filtered expenses for selected month
function getFilteredExpenses() {
    const selectedMonth = monthSelector.value; // "2025-12"
    if (!selectedMonth) return expenses;
    const [year, month] = selectedMonth.split('-');
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === parseInt(year) && expenseDate.getMonth() + 1 === parseInt(month);
    });
}

// Set budget
setBudgetBtn.addEventListener('click', () => {
    const newBudget = parseFloat(budgetInput.value);
    if (newBudget > 0) {
        budget = newBudget;
        localStorage.setItem('budget', budget);
        budgetInput.value = '';
        updateDisplay();
    } else {
        alert('Please enter a valid budget amount.');
    }
});

// Add expense
addExpenseBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    if (amount > 0) {
        const expense = {
            id: Date.now() + Math.random(),
            amount,
            category,
            date: new Date().toISOString()
        };
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        amountInput.value = '';
        updateDisplay();
    } else {
        alert('Please enter a valid amount.');
    }
});

// Month selector change
monthSelector.addEventListener('change', updateDisplay);

// Event delegation for dynamic buttons
expenseList.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('edit-btn')) {
        editExpense(target.dataset.id);
    } else if (target.classList.contains('delete-btn')) {
        deleteExpense(target.dataset.id);
    }
});

// Calculate totals
function calculateTotals(filteredExpenses) {
    const totals = { food: 0, travel: 0, other: 0 };
    let totalSpent = 0;
    filteredExpenses.forEach(expense => {
        totals[expense.category] += expense.amount;
        totalSpent += expense.amount;
    });
    return { totals, totalSpent };
}

// Calculate daily totals
function calculateDailyTotals(filteredExpenses) {
    const daily = {};
    filteredExpenses.forEach(expense => {
        const displayDate = new Date(expense.date).toLocaleDateString();
        if (!daily[displayDate]) daily[displayDate] = 0;
        daily[displayDate] += expense.amount;
    });
    // Sort dates descending
    return Object.entries(daily).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

// Edit expense
function editExpense(id) {
    const expense = expenses.find(e => e.id == id);
    if (!expense) return;
    editingIndex = expenses.indexOf(expense);
    editAmount.value = expense.amount;
    editCategory.value = expense.category;
    editSection.style.display = 'block';
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id != id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateDisplay();
    }
}

// Save edit
saveEditBtn.addEventListener('click', () => {
    const amount = parseFloat(editAmount.value);
    if (amount > 0 && editingIndex !== -1) {
        expenses[editingIndex].amount = amount;
        expenses[editingIndex].category = editCategory.value;
        localStorage.setItem('expenses', JSON.stringify(expenses));
        editSection.style.display = 'none';
        editingIndex = -1;
        updateDisplay();
    } else {
        alert('Please enter a valid amount.');
    }
});

// Cancel edit
cancelEditBtn.addEventListener('click', () => {
    editSection.style.display = 'none';
    editingIndex = -1;
});

// Update display
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
            <div class="expense-info">₹${expense.amount.toFixed(2)} - ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} - ${new Date(expense.date).toLocaleDateString()}</div>
            <div class="expense-actions">
                <button class="edit-btn" data-id="${expense.id}">Edit</button>
                <button class="delete-btn" data-id="${expense.id}">Delete</button>
            </div>
        `;
        expenseList.appendChild(li);
    });
}
