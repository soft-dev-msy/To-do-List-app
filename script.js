  // JavaScript will go here
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskInput = document.getElementById('task-input');
            const dueDateInput = document.getElementById('due-date');
            const prioritySelect = document.getElementById('priority');
            const addTaskBtn = document.getElementById('add-task-btn');
            const taskList = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const clearCompletedBtn = document.getElementById('clear-completed');
            const themeToggleBtn = document.querySelector('.theme-toggle');
            const totalTasksElement = document.getElementById('total-tasks');
            const completedTasksElement = document.getElementById('completed-tasks');
            const pendingTasksElement = document.getElementById('pending-tasks');

            // Current filter state
            let currentFilter = 'all';
            
            // Initialize the app
            init();

            // Initialize the app
            function init() {
                loadTasks();
                updateStats();
                setupEventListeners();
                setInitialDueDate();
            }

            function setInitialDueDate() {
                // Set the minimum date to today
                const today = new Date().toISOString().split('T')[0];
                dueDateInput.min = today;
            }

            function setupEventListeners() {
                // Add task event listeners
                addTaskBtn.addEventListener('click', addTask);
                taskInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') addTask();
                });

                // Filter event listeners
                filterButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        filterButtons.forEach(btn => btn.classList.remove('active'));
                        this.classList.add('active');
                        currentFilter = this.dataset.filter;
                        filterTasks(currentFilter);
                    });
                });

                // Clear completed tasks
                clearCompletedBtn.addEventListener('click', clearCompletedTasks);

                // Theme toggle
                themeToggleBtn.addEventListener('click', toggleTheme);
            }

            // Add a new task
            function addTask() {
                const taskText = taskInput.value.trim();
                const dueDate = dueDateInput.value;
                const priority = prioritySelect.value;

                if (!taskText) {
                    showError('Task cannot be empty!');
                    return;
                }

                const task = {
                    id: Date.now(),
                    text: taskText,
                    completed: false,
                    dueDate: dueDate || null,
                    priority: priority,
                    createdAt: new Date().toISOString()
                };

                saveTask(task);
                renderTask(task);
                taskInput.value = '';
                dueDateInput.value = '';
                prioritySelect.value = 'medium';
                taskInput.focus();
                updateStats();
                hideEmptyState();
            }

            // Save task to local storage
            function saveTask(task) {
                const tasks = getTasks();
                tasks.push(task);
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }

            // Get all tasks from local storage
            function getTasks() {
                return JSON.parse(localStorage.getItem('tasks')) || [];
            }

            // Load tasks from local storage
            function loadTasks() {
                const tasks = getTasks();
                if (tasks.length === 0) {
                    showEmptyState();
                    return;
                }

                hideEmptyState();
                tasks.forEach(task => renderTask(task));
                filterTasks(currentFilter);
            }

            // Render a single task
            function renderTask(task) {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                taskItem.dataset.id = task.id;
                taskItem.dataset.priority = task.priority;
                taskItem.dataset.status = task.completed ? 'completed' : 'active';

                // Format due date if it exists
                let dueDateFormatted = '';
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    dueDateFormatted = dueDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    });

                    // Add overdue styling if task is not completed and due date is in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (!task.completed && dueDate < today) {
                        taskItem.classList.add('overdue');
                    }
                }

                // Priority label text
                const priorityText = {
                    low: 'Low',
                    medium: 'Medium',
                    high: 'High'
                }[task.priority];

                taskItem.innerHTML = `
                    <div class="custom-checkbox ${task.completed ? 'checked' : ''}"></div>
                    <div class="task-content">
                        <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                        <div class="task-meta">
                            ${dueDateFormatted ? `<span><i class="far fa-calendar-alt"></i> ${dueDateFormatted}</span>` : ''}
                            <span class="task-priority priority-${task.priority}">${priorityText}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit" title="Edit task"><i class="far fa-edit"></i></button>
                        <button class="task-btn delete" title="Delete task"><i class="far fa-trash-alt"></i></button>
                    </div>
                `;

                // Insert the new task at the beginning of the list
                if (taskList.firstChild && taskList.firstChild.classList.contains('empty-state')) {
                    taskList.replaceChild(taskItem, taskList.firstChild);
                } else {
                    taskList.insertBefore(taskItem, taskList.firstChild);
                }

                // Add event listeners to the new task
                const checkbox = taskItem.querySelector('.custom-checkbox');
                const editBtn = taskItem.querySelector('.edit');
                const deleteBtn = taskItem.querySelector('.delete');

                checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));
                editBtn.addEventListener('click', () => editTask(task.id));
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
            }

            // Toggle task completion status
            function toggleTaskCompletion(taskId) {
                const tasks = getTasks();
                const taskIndex = tasks.findIndex(task => task.id == taskId);
                
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = !tasks[taskIndex].completed;
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    
                    // Update the task in the DOM
                    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
                    if (taskElement) {
                        const checkbox = taskElement.querySelector('.custom-checkbox');
                        const taskText = taskElement.querySelector('.task-text');
                        
                        checkbox.classList.toggle('checked');
                        taskText.classList.toggle('completed');
                        taskElement.dataset.status = tasks[taskIndex].completed ? 'completed' : 'active';
                        
                        // Re-apply filter after status change
                        filterTasks(currentFilter);
                    }
                    
                    updateStats();
                }
            }

            // Edit a task
            function editTask(taskId) {
                const tasks = getTasks();
                const task = tasks.find(task => task.id == taskId);
                
                if (task) {
                    const newText = prompt('Edit your task:', task.text);
                    if (newText !== null && newText.trim() !== '') {
                        task.text = newText.trim();
                        localStorage.setItem('tasks', JSON.stringify(tasks));
                        
                        // Update the task in the DOM
                        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
                        if (taskElement) {
                            const taskText = taskElement.querySelector('.task-text');
                            taskText.textContent = task.text;
                        }
                    }
                }
            }

            // Delete a task with animation
            function deleteTask(taskId) {
                const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
                if (!taskElement) return;
                
                // Add fade-out animation
                taskElement.classList.add('fade-out');
                
                // Remove from DOM after animation completes
                setTimeout(() => {
                    // Remove from local storage
                    const tasks = getTasks();
                    const updatedTasks = tasks.filter(task => task.id != taskId);
                    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
                    
                    taskElement.remove();
                    updateStats();
                    
                    // Show empty state if no tasks left
                    if (updatedTasks.length === 0) {
                        showEmptyState();
                    }
                }, 300);
            }

            // Filter tasks based on status
            function filterTasks(filter) {
                const tasks = document.querySelectorAll('.task-item');
                
                tasks.forEach(task => {
                    switch (filter) {
                        case 'all':
                            task.style.display = 'flex';
                            break;
                        case 'active':
                            task.style.display = task.dataset.status === 'active' ? 'flex' : 'none';
                            break;
                        case 'completed':
                            task.style.display = task.dataset.status === 'completed' ? 'flex' : 'none';
                            break;
                    }
                });
            }

            // Clear all completed tasks
            function clearCompletedTasks() {
                if (!confirm('Are you sure you want to clear all completed tasks?')) return;
                
                const tasks = getTasks();
                const activeTasks = tasks.filter(task => !task.completed);
                localStorage.setItem('tasks', JSON.stringify(activeTasks));
                
                // Remove completed tasks from DOM
                document.querySelectorAll('.task-item[data-status="completed"]').forEach(task => {
                    task.classList.add('fade-out');
                    setTimeout(() => task.remove(), 300);
                });
                
                updateStats();
                
                // Show empty state if no tasks left
                if (activeTasks.length === 0) {
                    showEmptyState();
                }
            }

            // Update task statistics
            function updateStats() {
                const tasks = getTasks();
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(task => task.completed).length;
                const pendingTasks = totalTasks - completedTasks;
                
                totalTasksElement.textContent = totalTasks;
                completedTasksElement.textContent = completedTasks;
                pendingTasksElement.textContent = pendingTasks;
            }

            // Show empty state
            function showEmptyState() {
                emptyState.style.display = 'block';
            }

            // Hide empty state
            function hideEmptyState() {
                emptyState.style.display = 'none';
            }

            // Show error message
            function showError(message) {
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = message;
                errorElement.style.color = 'var(--danger-color)';
                errorElement.style.marginTop = '5px';
                
                const inputContainer = taskInput.parentElement;
                const existingError = inputContainer.querySelector('.error-message');
                if (existingError) existingError.remove();
                
                inputContainer.appendChild(errorElement);
                
                setTimeout(() => {
                    errorElement.style.opacity = '1';
                    setTimeout(() => {
                        errorElement.style.opacity = '0';
                        setTimeout(() => errorElement.remove(), 300);
                    }, 2000);
                }, 10);
            }

            // Toggle between light and dark theme
            function toggleTheme() {
                document.body.classList.toggle('dark-theme');
                const icon = themeToggleBtn.querySelector('i');
                
                if (document.body.classList.contains('dark-theme')) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    localStorage.setItem('theme', 'dark');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    localStorage.setItem('theme', 'light');
                }
            }

            // Check for saved theme preference
            function checkTheme() {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark') {
                    document.body.classList.add('dark-theme');
                    const icon = themeToggleBtn.querySelector('i');
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }

            // Initialize theme
            checkTheme();
        });
        // Previous JavaScript remains the same, adding new functionality
        
        document.addEventListener('DOMContentLoaded', function() {
            // New DOM elements
            const sortButtons = document.querySelectorAll('.sort-btn');
            const priorityFilters = document.querySelectorAll('.priority-filter');
            const confirmationDialog = document.getElementById('confirmation-dialog');
            const dialogTitle = document.getElementById('dialog-title');
            const dialogMessage = document.getElementById('dialog-message');
            const dialogCancel = document.getElementById('dialog-cancel');
            const dialogConfirm = document.getElementById('dialog-confirm');
            
            // Current sort and filter states
            let currentSort = 'default';
            let currentPriorityFilter = ['low', 'medium', 'high'];
            
            // Initialize with new features
            init();
            
            function init() {
                // Previous initialization code
                setupNewEventListeners();
            }
            
            function setupNewEventListeners() {
                // Sort buttons
                sortButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        sortButtons.forEach(btn => btn.classList.remove('active'));
                        this.classList.add('active');
                        currentSort = this.dataset.sort;
                        applySortAndFilter();
                    });
                });
                
                // Priority filters
                priorityFilters.forEach(filter => {
                    filter.addEventListener('click', function() {
                        this.classList.toggle('active');
                        updatePriorityFilter();
                        applySortAndFilter();
                    });
                });
                
                // Confirmation dialog
                dialogCancel.addEventListener('click', hideConfirmationDialog);
            }
            
            // Apply both sorting and filtering
            function applySortAndFilter() {
                const tasks = getTasks();
                
                // Filter by status first
                let filteredTasks = tasks.filter(task => {
                    if (currentFilter === 'all') {
                        return currentPriorityFilter.includes(task.priority);
                    } else if (currentFilter === 'active') {
                        return !task.completed && currentPriorityFilter.includes(task.priority);
                    } else {
                        return task.completed && currentPriorityFilter.includes(task.priority);
                    }
                });
                
                // Then sort
                filteredTasks.sort((a, b) => {
                    if (currentSort === 'due-date') {
                        // Sort by due date (tasks without date go last)
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    } else if (currentSort === 'priority') {
                        // Sort by priority (high > medium > low)
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    } else {
                        // Default sort (by creation date, newest first)
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                });
                
                // Re-render tasks
                taskList.innerHTML = '';
                if (filteredTasks.length === 0) {
                    showEmptyState();
                } else {
                    hideEmptyState();
                    filteredTasks.forEach(task => renderTask(task));
                }
            }
            
            // Update priority filter based on active chips
            function updatePriorityFilter() {
                currentPriorityFilter = [];
                priorityFilters.forEach(filter => {
                    if (filter.classList.contains('active')) {
                        currentPriorityFilter.push(filter.dataset.priority);
                    }
                });
                
                // If all are inactive, show none
                if (currentPriorityFilter.length === 0) {
                    priorityFilters.forEach(filter => filter.classList.add('active'));
                    currentPriorityFilter = ['low', 'medium', 'high'];
                }
            }
            
            // Show confirmation dialog
            function showConfirmationDialog(title, message, confirmCallback) {
                dialogTitle.textContent = title;
                dialogMessage.textContent = message;
                confirmationDialog.classList.add('active');
                
                // Store the confirm callback
                dialogConfirm.onclick = function() {
                    confirmCallback();
                    hideConfirmationDialog();
                };
            }
            
            // Hide confirmation dialog
            function hideConfirmationDialog() {
                confirmationDialog.classList.remove('active');
            }
            
            // Modified deleteTask function to use confirmation dialog
            function deleteTask(taskId) {
                const taskElement = document.querySelector(.task-item[data-id="${taskId}"]);
                if (!taskElement) return;
                
                showConfirmationDialog(
                    'Delete Task',
                    'Are you sure you want to delete this task? This action cannot be undone.',
                    function() {
                        // Add fade-out animation
                        taskElement.classList.add('fade-out');
                        showNotification('Task deleted!', 'info');
                        
                        // Remove from DOM after animation completes
                        setTimeout(() => {
                            // Remove from local storage
                            const tasks = getTasks();
                            const updatedTasks = tasks.filter(task => task.id != taskId);
                            
                            try {
                                localStorage.setItem('tasks', JSON.stringify(updatedTasks));
                            } catch (e) {
                                showNotification('Error deleting task: ' + e.message, 'error');
                                return;
                            }
                            
                            taskElement.remove();
                            updateStats();
                            
                            // Show empty state if no tasks left
                            if (updatedTasks.length === 0) {
                                showEmptyState();
                            }
                        }, 300);
                    }
                );
            }
            
            // Modified clearCompletedTasks to use confirmation dialog
            function clearCompletedTasks() {
                const completedCount = document.querySelectorAll('.task-item[data-status="completed"]').length;
                if (completedCount === 0) {
                    showNotification('No completed tasks to clear!', 'info');
                    return;
                }
                
                showConfirmationDialog(
                    'Clear Completed Tasks',
                    Are you sure you want to clear ${completedCount} completed tasks? This action cannot be undone.,
                    function() {
                        const tasks = getTasks();
                        const activeTasks = tasks.filter(task => !task.completed);
                        
                        try {
                            localStorage.setItem('tasks', JSON.stringify(activeTasks));
                        } catch (e) {
                            showNotification('Error clearing tasks: ' + e.message, 'error');
                            return;
                        }
                        
                        // Remove completed tasks from DOM
                        const completedTasks = document.querySelectorAll('.task-item[data-status="completed"]');
                        if (completedTasks.length > 0) {
                            showNotification(Cleared ${completedTasks.length} completed tasks!, 'success');
                        }
                        
                        completedTasks.forEach(task => {
                            task.classList.add('fade-out');
                            setTimeout(() => task.remove(), 300);
                        });
                        
                        updateStats();
                        
                        // Show empty state if no tasks left
                        if (activeTasks.length === 0) {
                            showEmptyState();
                        }
                    }
                );
            }
            
            // Update all existing filter functions to use applySortAndFilter
            function filterTasks(filter) {
                currentFilter = filter;
                applySortAndFilter();
            }
            
            // Update other functions that need to refresh the task list
            function addTask() {
                // ... existing addTask code ...
                applySortAndFilter(); // Instead of filterTasks(currentFilter)
            }
            
            function toggleTaskCompletion(taskId) {
                // ... existing toggleTaskCompletion code ...
                applySortAndFilter(); // Instead of filterTasks(currentFilter)
            }
            
            function editTask(taskId) {
                // ... existing editTask code ...
                applySortAndFilter(); // Instead of filterTasks(currentFilter)
            }
        });
