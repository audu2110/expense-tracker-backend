const path = require('path');

const express = require('express');

const router = express.Router();
const Expense = require('../models/expense');


const bodyParser = require('body-parser');
router.use(bodyParser.json())
// router.use(bodyParser.urlencoded({ extended: true }));

exports.postAddExpense= async (req,res,next)=>{
    try{
        var amount=req.body.amount;
        var Description=req.body.Description;
        var category=req.body.category;
        const data= await Expense.create({amount:amount, Description:Description, category:category})
        res.status(201).json({newExpenseDetail:data})
    }
    catch(err){
        res.status(500).json({
            error:err
        })
    }
}

exports.getExpenses= async (req,res,next)=>{
    try{
        const expenses=await Expense.findAll();
        res.status(200).json({allExpenses:expenses})
    }
    catch(error){
        console.log("Get expense is failing",JSON.stringify(error));
        res.status(500).json({
            error:error
        })
    }
    
}

exports.deleteExpense= async(req,res,next)=>{
    try{
        const uId=req.params.id;
        console.log(uId);
        await Expense.destroy({where:{id:uId}});
        res.sendStatus(200);
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
    
}