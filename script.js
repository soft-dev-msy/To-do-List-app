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
