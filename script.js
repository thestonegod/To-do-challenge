//Completed tasks/totaltasks*100 = Progress bar
//Capture,store,render,edit  = Task properties
//HTML provides empty slot, JS fills it up = task-list
//Keyboard access, persist filters, local storage, system preference

document.addEventListener('DOMContentLoaded', () => {

    //Modal elements
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const modalCloseBtn = taskModal.querySelector('.modal-close');
    const cancelBtn = taskForm.querySelector('.cancel-button');
    const createBtn = taskForm.querySelector('.create-button');
    const emptyMsg = document.querySelector('.empty-state-msg');
   

    //Form inputs
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const dueDateInput = document.getElementById('task-due-date');
    const priorityInput = document.querySelectorAll('input[name="task-priority"]');


    //Theme toggle logic
    const toggleBtn = document.getElementById('theme-toggle');

    toggleBtn.addEventListener('click', () => {
    const root = document.documentElement;

    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
    });

    const tasks = []
    const tasklist = document.querySelector('.task-list');
    let editingTaskId = null;
    

    //filter logic
    const filterSelect = document.querySelector('.filter-dd');
    let currentFilter = 'all';
    filterSelect.addEventListener('change',() =>{
        currentFilter = filterSelect.value;
        renderTasks();
    });

    //Sort logic
    const sortSelect = document.querySelector('.sort-dd');
    let currentSort = 'created';
    sortSelect.addEventListener('change',() => {
        currentSort = sortSelect.value;
        renderTasks();
    });
    
    ////////
    //Opening & closing of modal funcs
    function openModal() {
        taskModal.setAttribute('aria-hidden', 'false');
    };

    function closeModal() {
        taskModal.setAttribute('aria-hidden', 'true');
        taskForm.reset();
        editingTaskId = null; //Prevents ghost edits &tracks whether modal is in create or edit mode
    };

    //Event listeners for modal 
    document.getElementById('add-task-button').addEventListener('click', openModal);

    modalCloseBtn.addEventListener('click', closeModal);

    cancelBtn.addEventListener('click', closeModal);

    //Get task data/
    function getTaskData() {
        const priorityInputs = document.querySelectorAll('input[name="task-priority"]');
        //Finds the checked priority 
        const selectedPriority = Array.from(priorityInputs).find(input => input.checked);
        return{
            id: Date.now(), 
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            dueDate: dueDateInput.value,
            //This code represents the edge case incase no priority is choosen. "?"= Tenary operator
            priority: selectedPriority? selectedPriority.value: 'low',
            status: 'pending'
        };
    }
     

    //Validation
    function validateTask(task) {
        if (!task.title) {
            alert('Task title required!');
            return false;
        }
        return true
    }

     
    //create button handler
    createBtn.addEventListener('click', () =>{
        const taskData = getTaskData();
        if (!validateTask(taskData)) return;

        if (editingTaskId === null) {
           //Create task
           tasks.push(taskData);
        } else {
            //Update
            const task = tasks.find(t => t.id === editingTaskId);
            if (!task) return;

            task.title = taskData.title;
            task.description = taskData.description;
            task.dueDate = taskData.dueDate;
            task.priority = taskData.priority;
            editingTaskId = null; //Reset

        }

       // console.log(newTask);//placeholder for rendering logic
        //closeModal(); =Temporary checkpoint
        renderTasks();
        closeModal();
    });

    function computeTaskStatus(task) {
        //Once complete never auto update
        if (task.status === 'completed'){
            return 'completed';}
          //Check overdue
        if (task.dueDate) {
            const today = new Date();
            const due = new Date(task.dueDate);
            //
            today.setHours(0,0,0,0);
            due.setHours(0,0,0,0);

            if (due < today){
                return 'overdue';
            }
            
        } //Default state. 'else' is unnecessary because if none of the if conditions are met,
          //code naturally reaches last return
            return 'pending'
    }
    

    //Render tasks
    //Clear task list
    //Loop through tasks
    //Inject tasks into .task-list
    function renderTasks() {
        tasklist.innerHTML = '';

        tasks.forEach(task => {
            //Compute & store task status
            task.status = computeTaskStatus(task);


            //Filter logic
            if (currentFilter !== 'all' && task.status !== currentFilter) return;
            const li = document.createElement('li');
            li.classList.add('task-item');
            li.dataset.status = task.status;
            li.dataset.priority = task.priority;
            li.dataset.id = task.id;

            //UI Rendering
                li.innerHTML = `<article>
                <header><h3>${task.title}</h3></header> 
                <p>${task.description || ''} </p>

                <div><time>${task.dueDate || 'No due date'}</time></div>

                <footer>
                <button data-action="complete">Complete</button>
                <button data-action="delete">Delete</button>
                <button data-action="edit">Edit</button>
                </footer>
                </article>`;

                tasklist.appendChild(li);
            });

            //empty state msg//
            emptyMsg.hidden = tasklist.children.length !==0;
            //Progress bar
            updateProgressBars();
            
        
    };

    //Task count logic
    function getTaskCounts() {
    return {
        all: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: tasks.filter(t => t.status === 'overdue').length
    };
   }

    //Event listeners for dynamically created buttons: Detects clicks
    tasklist.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if(!action) return;

        const taskItem = e.target.closest('.task-item');
        const taskId = Number(taskItem.dataset.id);
        if(action === 'delete') {deleteTask(taskId)};
        if (action === 'complete') {completeTask(taskId)};
        if (action === 'edit') {startEditTask(taskId)};
    });

     //Search tasks array, find task and update status
    function deleteTask(id) {
    const index = tasks.findIndex(task => task.id === id);
    if ( index === -1 ) return;

    tasks.splice(index, 1);
    renderTasks();
   }

  
    function completeTask(id) {
    const task = tasks.find(task => task.id === id);
    if ( !task ) return;

        task.status = 'completed';
        renderTasks();
    }

 //Find task, open modal, prefill input, set editingTaskId
    function startEditTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        //Container for which taask is being mutated
        editingTaskId = id;
        //Prefill form
        titleInput.value = task.title;
        descInput.value = task.description
        dueDateInput.value =task.dueDate

        //Priority readio check
        priorityInput.forEach(input =>{
            input.checked = input.value === task.priority;
        });
        openModal();
    }

   //Progress bars
   function updateProgressBars() {
    const total = tasks.length;
    const completed = tasks.filter (task => task.status === 'completed').length;
    const pending = tasks.filter (task => task.status === 'pending').length;
    const overdue = tasks.filter(task => task.status === 'overdue').length;
    const percent = total === 0?0: (completed/ total)*100;

    //Main progress bar
    const mainFill = document.querySelector('.progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    mainFill.style.width = `${percent}%`;
    progressText.textContent = `Completed: ${completed} | Pending: ${pending} | Overdue: ${overdue} | Total: ${total}`;

    //Mini progress bar
    const miniFill = document.querySelector('.mini-progress-fill');
    miniFill.style.width = `${percent}%`;
   }
    

});
 