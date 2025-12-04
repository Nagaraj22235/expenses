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
        const { error } = await supabase
            .from('budgets')
            .upsert({ user_id: currentUser.id, amount: newBudget });
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
    const category = categorySelect.value;
    if (amount > 0) {
        const { data, error } = await supabase
            .from('expenses')
            .insert({
                user_id: currentUser.id,
                amount: amount,
                category: category,
                date: new Date().toISOString()
            })
            .select()
            .single();
        if (error) {
            alert('Error adding expense: ' + error.message);
            return;
        }
        expenses.unshift(data);
        amountInput.value = '';
        updateDisplay();
    } else {
        alert('Please enter a valid amount.');
    }
});

saveEditBtn.addEventListener('click', async () => {
    const amount = parseFloat(editAmount.value);
    if (amount > 0 && editingExpense) {
        const { error } = await supabase
            .from('expenses')
            .update({
                amount: amount,
                category: editCategory.value
            })
            .eq('id', editingExpense.id);
        if (error) {
            alert('Error updating expense: ' + error.message);
            return;
        }
        editingExpense.amount = amount;
        editingExpense.category = editCategory.value;
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
    editCategory.value = expense.category;
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
