import { createTheme } from '@mui/material/styles';

export const themeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f8bbd0',
    },
    warning: {
      main: '#edc802',
    },
    background: {
      default: '#e9f3db',
      paper: '#dcfce7',
    },
    text: {
      primary: '#03061c',
      secondary: '#241ec7',
      disabled: 'rgba(92,90,90,0.54)',
      hint: '#00796b',
    },
  },
  typography: {
    h2: {
      fontSize: 40,
      fontWeight: 700,
      fontFamily: 'Raleway',
      lineHeight: 1.14,
    },
    h3: {
      fontSize: 30,
      fontWeight: 600,
    },
    fontSize: 14,
    fontWeightLight: 300,
    htmlFontSize: 16,
    h4: {
      fontSize: 25,
    },
    h5: {
      fontSize: 19,
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '4px',
          '& .MuiInputBase-root': {
            backgroundColor: '#f5f5f5',
            height: '40px',
            padding: '4px 8px'
          },
          '&.multiline-field': {
            width: '100%',
            '& .MuiInputBase-root': {
              height: 'auto',
              minHeight: '100px',
              backgroundColor: '#f5f5f5'
            },
            '& .MuiInputBase-inputMultiline': {
              position: 'static',
              padding: '8px',
              minHeight: '80px'
            },
            '& .MuiInputLabel-root': {
              transform: 'translate(14px, -6px) scale(0.75)',
              backgroundColor: '#f5f5f5',
              padding: '0 4px'
            }
          },
          '& .MuiInputLabel-root': {
            backgroundColor: '#f5f5f5',
            padding: '0 4px',
            marginLeft: '-4px'
          }
        }
      },
      defaultProps: {
        variant: 'outlined',
        size: 'small',
        margin: 'dense'
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            height: '40px',
            padding: '10px',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: '8px',
          '&.form-field-container': {
            height: 'auto',
            minHeight: '40px'
          }
        }
      },
      defaultProps: {
        margin: 'dense',
        size: 'small',
      }
    },
    MuiTable: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#dcfce7',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '4px 8px',
          height: '32px',
        },
        head: {
          backgroundColor: '#bae6c3',
          fontWeight: 700,
          color: '#1a3e1c',
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          '&.Mui-selected': {
            backgroundColor: '#c1e6c9',
            '&:hover': {
              backgroundColor: '#b1d6b9',
            }
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiButtonGroup: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiCheckbox: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiFab: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiIconButton: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiRadio: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiSwitch: {
      defaultProps: {
        size: 'small',
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#3f51b5',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#dcfce7',
        }
      }
    },
    MuiBox: {
      variants: [
        {
          props: { className: 'form-container' },
          style: {
            backgroundColor: '#dcfce7',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            minHeight: '100%',
            '& .MuiFormControl-root': {
              backgroundColor: '#fff',
              marginBottom: '8px'
            }
          }
        }
      ]
    }
  },
};

const theme = createTheme(themeOptions);

export default theme;