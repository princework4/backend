const LayoutModel = require('../models/layout.model');
const CatchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary').v2;

// Create_layout 
const createLayout = CatchAsyncError(async (req, res, next) => {
    const { type, image, title, subTitle, faqData, categoriesData } = req.body;

    if (!type) {
        return next(new ErrorHandler("Type is required", 400));
    }

    try {
        if (type === "Banner") {
            if (!image || !title || !subTitle) {
                return next(new ErrorHandler("Image, title, and subTitle are required for banner", 400));
            }

            const myCloud = await cloudinary.uploader.upload(image, {
                folder: "Layout"
            });

            const bannerImageSchemaData = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                subTitle
            };

            await LayoutModel.create({ type: type, banner: bannerImageSchemaData });

        } else if (type === "FAQ") {
            if (!Array.isArray(faqData) || faqData.length === 0) {
                return next(new ErrorHandler("faqData must be a non-empty array", 400));
            }

            const faq = faqData.map(faq => ({
                question: faq.question,
                answer: faq.answer
            }));

            await LayoutModel.create({ type: type, faq });

        } else if (type === "Categories") {
            if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
                return next(new ErrorHandler("categoriesData must be a non-empty array", 400));
            }

            const categories = categoriesData.map(item => ({
                title: item.title
            }));

            await LayoutModel.create({ type: type, category: categories });

        } else {
            return next(new ErrorHandler("Invalid type", 400));
        }

        res.status(201).json({
            success: true,
            message: "Layout created successfully"
        });

    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});



// Edit Layout
const editLayout = CatchAsyncError(async (req, res, next) => {
    const { type, image, title, subTitle, faqData, categoriesData } = req.body;

    if (!type) {
        return next(new ErrorHandler("Type is required", 400));
    }

    try {
        if (type === "Banner") {
            if (!image || !title || !subTitle) {
                return next(new ErrorHandler("Image, title, and subTitle are required for banner", 400));
            }

            // Finding the document which have type = Banner
            const bannerData = await LayoutModel.findOne({ type: "Banner" })
            // Destroy Existing Cloudinary
            if (bannerData) {
                await cloudinary.uploader.destroy(bannerData.banner.image.public_id);
            }

            const myCloud = await cloudinary.uploader.upload(image, {
                folder: "Layout"
            });

            const bannerImageSchemaData = {
                type: type,
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                subTitle
            };

            await LayoutModel.findByIdAndUpdate(bannerData._id, { banner : bannerImageSchemaData });

        } else if (type === "FAQ") {
            if (!Array.isArray(faqData) || faqData.length === 0) {
                return next(new ErrorHandler("faqData must be a non-empty array", 400));
            };

            const ExistingFaqData = await LayoutModel.findOne({ type: "FAQ" });
            if (!ExistingFaqData) {
                return next(new ErrorHandler("FAQ Data is not found", 404))
            }

            const faq = faqData.map(faq => ({
                question: faq.question,
                answer: faq.answer
            }));

            await LayoutModel.findByIdAndUpdate(ExistingFaqData._id, { type: type, faq });

        } else if (type === "Categories") {
            if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
                return next(new ErrorHandler("categoriesData must be a non-empty array", 400));
            }

            const ExistingCategoriesData = await LayoutModel.findOne({ type: "Categories" });
            if (!ExistingCategoriesData) {
                return next(new ErrorHandler("Categories Data is not found", 404))
            }

            const categories = categoriesData.map(item => ({
                title: item.title
            }));

            await LayoutModel.findByIdAndUpdate(ExistingCategoriesData._id, { type: type, category: categories });

        } else {
            return next(new ErrorHandler("Invalid type", 400));
        }

        res.status(201).json({
            success: true,
            message: "Layout updated successfully"
        });

    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
});









// Get Layout
const getLayout = CatchAsyncError(async (req, res, next) => {
    try {
        const {type} = req.body

        if(!type){
            return next(new ErrorHandler("Please provide type", 400))
        }
        const layout = await LayoutModel.findOne({type})

        res.status(201).json({
            success : true,
            data : layout
        })
    } catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
}) 

module.exports = { createLayout, editLayout, getLayout };
