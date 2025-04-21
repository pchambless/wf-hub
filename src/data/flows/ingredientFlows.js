/**
 * Ingredient management related navigation flows
 */
export default [
  {
    "id": 14,
    "parentId": 5,  // Home
    "title": "Ingredient Types",
    "slug": "ingr-type-list",
    "action": "list",
    "description": "View and manage ingredient categories.",
    "technical": "call spIngrType_list (@acctID, @active)"
  },
  {
    "id": 11,
    "parentId": 14,
    "title": "Add Ingredient Type",
    "slug": "ingr-type-add",
    "action": "create",
    "description": "Create a new ingredient category.",
    "technical": "call spIngrType_insert (@name, @description, @acctID, @userID)"
  },
  // More ingredient-related flows...
];