export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res, next);
  } catch (error) {
   return   res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};  

