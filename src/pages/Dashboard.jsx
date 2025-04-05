// File: src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Button, 
  Typography, 
  Input, 
  Tag, 
  Space, 
  Dropdown, 
  Avatar, 
  Tooltip,
  Select,
  Divider
} from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  LogoutOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

// Sample categories for the app
const CATEGORIES = [
  { value: 'work', label: 'Work', color: 'blue' },
  { value: 'personal', label: 'Personal', color: 'green' },
  { value: 'study', label: 'Study', color: 'purple' },
  { value: 'health', label: 'Health', color: 'magenta' },
  { value: 'finance', label: 'Finance', color: 'gold' },
];

// Initial tasks for demo purposes
const INITIAL_TASKS = [
  { 
    id: 1, 
    title: 'Complete project proposal', 
    description: 'Finish the proposal for the new client project', 
    category: 'work', 
    completed: false, 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 2, 
    title: 'Go for a run', 
    description: '30 minute jog in the park', 
    category: 'health', 
    completed: true, 
    createdAt: new Date(Date.now() - 86400000).toISOString() 
  },
  { 
    id: 3, 
    title: 'Buy groceries', 
    description: 'Milk, eggs, bread, vegetables', 
    category: 'personal', 
    completed: false, 
    createdAt: new Date(Date.now() - 172800000).toISOString() 
  },
  { 
    id: 4, 
    title: 'Study React hooks', 
    description: 'Learn about useCallback and useMemo hooks', 
    category: 'study', 
    completed: false, 
    createdAt: new Date(Date.now() - 259200000).toISOString() 
  }
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load tasks from localStorage or use demo tasks on first load
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(INITIAL_TASKS);
      localStorage.setItem('tasks', JSON.stringify(INITIAL_TASKS));
    }
    setLoading(false);
  }, []);

  // Apply filters and search when tasks, filters, or search changes
  useEffect(() => {
    let result = [...tasks];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(task => task.category === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter === 'completed') {
      result = result.filter(task => task.completed);
    } else if (statusFilter === 'pending') {
      result = result.filter(task => !task.completed);
    }
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by creation date (newest first)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredTasks(result);
  }, [tasks, categoryFilter, statusFilter, searchText]);

  // Add a new task
  const addTask = (task) => {
    const newTask = {
      ...task,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      completed: false
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  // Update an existing task
  const updateTask = (taskId, updatedData) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updatedData } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  // Delete a task
  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  // Toggle task completion status
  const toggleTaskCompletion = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  // Show the modal to add/edit a task
  const showTaskModal = (task = null) => {
    setCurrentTask(task);
    setIsModalVisible(true);
  };

  // Handle modal submission
  const handleModalSubmit = (values) => {
    if (currentTask) {
      updateTask(currentTask.id, values);
    } else {
      addTask(values);
    }
    setIsModalVisible(false);
    setCurrentTask(null);
  };

  // Menu items for user dropdown
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout
    }
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        className="bg-white shadow-md"
      >
        <div className="h-16 flex items-center justify-center">
          <Typography.Title level={4} className="m-0 text-primary">
            {collapsed ? 'TM' : 'Task Manager'}
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['1']}
          className="border-r-0"
          items={[
            {
              key: 'all',
              label: 'All Tasks',
              onClick: () => setCategoryFilter('all')
            },
            ...CATEGORIES.map(cat => ({
              key: cat.value,
              label: (
                <Space>
                  {cat.label}
                  <Tag color={cat.color} className="ml-2 text-xs">
                    {tasks.filter(t => t.category === cat.value).length}
                  </Tag>
                </Space>
              ),
              onClick: () => setCategoryFilter(cat.value)
            }))
          ]}
        />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 flex items-center justify-between shadow-sm h-16">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="h-16 w-16"
          />
          <div className="flex-1 px-4">
            <Title level={4} className="m-0">Dashboard</Title>
          </div>
          <div className="px-4">
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight"
              arrow
            >
              <Button type="text" className="flex items-center">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 bg-gray-50">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large"
                onClick={() => showTaskModal()}
              >
                Add Task
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Search
                  placeholder="Search tasks..." 
                  allowClear
                  enterButton
                  size="large"
                  className="min-w-[200px]"
                  onSearch={setSearchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                
                <Select
                  size="large"
                  placeholder="Filter by status"
                  className="min-w-[150px]"
                  defaultValue="all"
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'pending', label: 'Pending' }
                  ]}
                  suffixIcon={<FilterOutlined />}
                />
              </div>
            </div>
            
            <Divider />
            
            <TaskList 
              tasks={filteredTasks}
              categories={CATEGORIES}
              onEdit={showTaskModal}
              onDelete={deleteTask}
              onToggleComplete={toggleTaskCompletion}
              loading={loading}
            />
          </div>
        </Content>
      </Layout>
      
      <TaskModal
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentTask(null);
        }}
        onSubmit={handleModalSubmit}
        categories={CATEGORIES}
        task={currentTask}
      />
    </Layout>
  );
};

export default Dashboard;