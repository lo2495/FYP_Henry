const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("CarrierApp", () => {
  let carrierapp
  let deployer, buyer

  const ID = 1
  const NAME = "Tesla"
  const CATEGORY = "Car"
  const IMAGE = ""
  const COST = tokens(1)
  const STOCK = 2

  beforeEach(async () => {
    [deployer, buyer] = await ethers.getSigners()
    const CarrierApp = await ethers.getContractFactory("CarrierApp")
    carrierapp = await CarrierApp.deploy()
  })

  describe("Deployment", () => {
    it("Sets the owner", async () => {
      expect(await carrierapp.owner()).to.equal(deployer.address)
    })
  })

  describe("Listing", () => {
    let transaction

    beforeEach(async () => {
      transaction = await carrierapp.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        STOCK
      )
      await transaction.wait()
    })
    it("Returns item attributes", async () => {
      const item = await carrierapp.items(ID)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emits List event", () =>{
      expect(transaction).to.emit(carrierapp, "List")
    })
  })

  describe("Buying", () => {
    let transaction

    beforeEach(async () => {
      transaction = await carrierapp.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        STOCK
      )
      await transaction.wait()
      transaction = await carrierapp.connect(buyer).buy(ID, { value: COST})
    })
    it("Updates the contract balance", async() =>{
      const result = await ethers.provider.getBalance(carrierapp.address)
      expect(result).to.equal(COST)
    })

    it("Updates buyer's order count", async()=>{
      const result = await carrierapp.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order", async()=>{
      const order = await carrierapp.orders(buyer.address, 1)
      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it("Updates the contract balance", async()=>{
      const result = await ethers.provider.getBalance(carrierapp.address)
      expect(result).to.equal(COST)
    })

    it("Emits Buy event", () => {
      expect(transaction).to.emit(carrierapp,"Buy")
    })
})

  describe("Withdrawing", ()=>{
    let balanceBefore

    beforeEach(async()=>{
      let transaction = await carrierapp.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, STOCK)
      await transaction.wait()
      
      transaction = await carrierapp.connect(buyer).buy(ID, {value: COST})
      await transaction.wait()

      balanceBefore = await ethers.provider.getBalance(deployer.address)

      transaction = await carrierapp.connect(deployer).withdraw()
      await transaction.wait()
    })
    
    it('Updates the owner balance', async()=>{
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async()=>{
      const result = await ethers.provider.getBalance(carrierapp.address)
      expect(result).to.equal(0)
    })
  })
})
