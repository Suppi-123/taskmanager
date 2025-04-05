// File: src/components/TaskList.jsx
import React from 'react';
import { List, Tag, Space, Button, Typography, Tooltip, Empty, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

const { Text } = Typography;

const TaskList = ({ 
  tasks, 
  categories, 
  onEdit, 
  onDelete, 
  onToggleComplete, 
  loading 
}) => {
  // Get category label and color by value
  const getCategoryInfo = (categoryValue) => {
    const category = categories.find(c => c.value === categoryValue);
    return category || { label: categoryValue, color: 'default' };
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <List
      itemLayout="horizontal"
      dataSource={tasks}
      loading={loading}
      locale={{
        emptyText: <Empty description="No tasks found" />
      }}
      renderItem={(task) => {
        const category = getCategoryInfo(task.category);
        
        return (
          <List.Item
            className={`p-4 mb-3 rounded-lg border ${task.completed ? 'bg-gray-50' : 'bg-white'}`}
            actions={[
              <Tooltip title="Edit">
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => onEdit(task)} 
                  type="text"
                />
              </Tooltip>,
              <Tooltip title="Delete">
                <Button 
                  icon={<DeleteOutlined />} 
                  onClick={() => onDelete(task.id)} 
                  type="text" 
                  danger
                />
              </Tooltip>
            ]}
          >
            <div className="flex items-start gap-3 w-full">
              <Checkbox
                checked={task.completed}
                onChange={() => onToggleComplete(task.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Text
                    className="font-medium text-lg"
                    delete={task.completed}
                  >
                    {task.title}
                  </Text>
                  <Space>
                    <Tag color={category.color}>{category.label}</Tag>
                    <Text type="secondary" className="text-xs">
                      {formatDate(task.createdAt)}
                    </Text>
                  </Space>
                </div>
                {task.description && (
                  <Text type="secondary" className="mt-1 mb-0 block">
                    {task.description}
                  </Text>
                )}
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default TaskList;