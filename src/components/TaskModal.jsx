// File: src/components/TaskModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

const TaskModal = ({ visible, onCancel, onSubmit, categories, task }) => {
  const [form] = Form.useForm();
  
  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (visible) {
      form.resetFields();
      
      // If editing an existing task, populate the form
      if (task) {
        form.setFieldsValue(task);
      }
    }
  }, [visible, task, form]);

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onSubmit(values);
        form.resetFields();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title={task ? 'Edit Task' : 'Add New Task'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {task ? 'Update' : 'Create'}
        </Button>
      ]}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        name="taskForm"
        initialValues={{
          title: '',
          description: '',
          category: categories[0]?.value || 'work'
        }}
      >
        <Form.Item
          name="title"
          label="Task Title"
          rules={[
            { required: true, message: 'Please enter a task title' },
            { max: 100, message: 'Title cannot be longer than 100 characters' }
          ]}
        >
          <Input placeholder="What needs to be done?" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 500, message: 'Description cannot be longer than 500 characters' }
          ]}
        >
          <TextArea 
            placeholder="Add details about this task (optional)"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select a category">
            {categories.map(category => (
              <Option key={category.value} value={category.value}>
                <Space>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskModal;