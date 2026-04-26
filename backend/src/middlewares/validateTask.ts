import { Request, Response, NextFunction } from 'express';
import { CreateTaskDTO } from '../types/task.types';

export function validateCreateTask(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { title, status, priority, dueDate } = req.body as CreateTaskDTO;

  // Validate title
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (title.length > 255) {
    return res.status(400).json({ message: 'Title must be less than 255 characters' });
  }

  // Validate status
  const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  // Validate priority
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ 
      message: `Priority must be one of: ${validPriorities.join(', ')}` 
    });
  }

  // Validate due date
  if (dueDate) {
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid due date format' });
    }
  }

  next();
}
