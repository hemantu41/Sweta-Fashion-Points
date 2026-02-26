#!/usr/bin/env node

/**
 * Script to verify a product's data in the database
 * Usage: node scripts/verify-product.mjs [productId]
 */

const productId = process.argv[2] || 'mens-jeans-1';

async function verifyProduct() {
  console.log(`Fetching product: ${productId}...\n`);

  try {
    const response = await fetch(`http://localhost:3000/api/products/${productId}`);
    const data = await response.json();

    if (response.ok && data.product) {
      const product = data.product;
      console.log('✅ Product found in database:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Product ID: ${product.productId}`);
      console.log(`Name: ${product.name}`);
      console.log(`Price: ₹${product.price}`);
      console.log(`Original Price: ₹${product.originalPrice || 'N/A'}`);
      console.log(`Category: ${product.category} > ${product.subCategory}`);
      console.log(`Stock: ${product.stockQuantity}`);
      console.log(`New Arrival: ${product.isNewArrival}`);
      console.log(`Best Seller: ${product.isBestSeller}`);
      console.log(`Active: ${product.isActive}`);
      console.log(`Updated At: ${product.updatedAt}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ Product not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyProduct();
