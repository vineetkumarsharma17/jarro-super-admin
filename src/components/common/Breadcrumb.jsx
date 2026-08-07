import React from 'react';
import { Breadcrumbs, Typography, Link, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable Breadcrumb component for navigation
 * @param {Array} items - Array of breadcrumb items { label, path }
 */
export default function Breadcrumb({ items = [] }) {
  const navigate = useNavigate();

  const handleClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ 
          py: 2,
          '& .MuiBreadcrumbs-separator': {
            mx: 1,
          }
        }}
      >
        <Link
          component="button"
          variant="body1"
          onClick={() => handleClick('/dashboard')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Home
        </Link>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          if (isLast) {
            return (
              <Typography
                key={index}
                color="text.primary"
                sx={{ fontWeight: 600 }}
              >
                {item.label}
              </Typography>
            );
          }
          
          return (
            <Link
              key={index}
              component="button"
              variant="body1"
              onClick={() => handleClick(item.path)}
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
