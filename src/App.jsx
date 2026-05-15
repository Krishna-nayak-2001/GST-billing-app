import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import './App.css'

function App() {
  const [items, setItems] = useState([])

  const [newItem, setNewItem] = useState({
    name: '',
    qty: '',
    rate: '',
    gst: 5
  })

  // Get current date in YYYY-MM-DD format for default
  const today = new Date().toISOString().split('T')[0]

  const [invoiceInfo, setInvoiceInfo] = useState({
    invoiceNo: '16',
    date: today,
    reverseCharge: 'N',
    state: 'DELHI',
    stateCode: '07',
    transportMode: '',
    vehicleNo: '',
    placeOfSupply: ''
  })

  const [receiverInfo, setReceiverInfo] = useState({
    name: 'Adyr Anand Bhawan',
    address: 'S-16, main market, green park, ND-16',
    gstin: '07AAICA3787F2ZH',
    state: 'DELHI',
    stateCode: '07'
  })

  const [editingId, setEditingId] = useState(null)

  const handleSubmitItem = (e) => {
    e.preventDefault()
    if (!newItem.name || !newItem.qty || !newItem.rate || Number(newItem.qty) <= 0 || Number(newItem.rate) <= 0) return

    if (editingId) {
      // Update existing item
      setItems(items.map(item =>
        item.id === editingId ? { ...newItem, qty: Number(newItem.qty), rate: Number(newItem.rate), id: editingId } : item
      ))
      setEditingId(null)
    } else {
      // Add new item
      setItems([...items, { ...newItem, qty: Number(newItem.qty), rate: Number(newItem.rate), id: Date.now() }])
    }

    setNewItem({ name: '', qty: '', rate: '', gst: 5 })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setNewItem({
      name: item.name,
      qty: item.qty,
      rate: item.rate,
      gst: item.gst
    })
    // Scroll to form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setNewItem({ name: '', qty: '', rate: '', gst: 5 })
    }
  }

  // Calculations
  const calculateTotals = () => {
    let totalBeforeTax = 0
    let totalCGST = 0
    let totalSGST = 0

    const itemTotals = items.map(item => {
      const amount = item.qty * item.rate
      const cgstRate = item.gst / 2
      const sgstRate = item.gst / 2
      const cgstAmount = amount * (cgstRate / 100)
      const sgstAmount = amount * (sgstRate / 100)

      totalBeforeTax += amount
      totalCGST += cgstAmount
      totalSGST += sgstAmount

      return {
        ...item,
        amount,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        total: amount + cgstAmount + sgstAmount
      }
    })

    const totalAmountAfterTax = totalBeforeTax + totalCGST + totalSGST

    return {
      itemTotals,
      totalBeforeTax,
      totalCGST,
      totalSGST,
      totalAmountAfterTax
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const { itemTotals, totalBeforeTax, totalCGST, totalSGST, totalAmountAfterTax } = calculateTotals()

  const handleDownload = async () => {
    const element = document.getElementById('invoice-bill')

    // Save current scroll position
    const scrollY = window.scrollY
    window.scrollTo(0, 0)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: element.scrollHeight,
        y: 0,
        scrollX: 0,
        scrollY: 0
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgProps = pdf.getImageProperties(imgData)
      const contentHeight = (imgProps.height * pdfWidth) / imgProps.width

      // If content is longer than one page, we might need multiple pages, 
      // but for a single invoice usually one page is enough if we scale it.
      // However, let's just ensure it fits or adds pages if needed.
      let heightLeft = contentHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, contentHeight)
      heightLeft -= pdfHeight

      while (heightLeft >= 0) {
        position = heightLeft - contentHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, contentHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`Invoice_${invoiceInfo.invoiceNo}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }

  // useEffect(() => {
  //   const savedItems = localStorage.getItem("items")
  //   const savedInvoice = localStorage.getItem("invoiceInfo")
  //   const savedReceiver = localStorage.getItem("receiverInfo")

  //   if (savedItems) setItems(JSON.parse(savedItems))
  //   if (savedInvoice) setInvoiceInfo(JSON.parse(savedInvoice))
  //   if (savedReceiver) setReceiverInfo(JSON.parse(savedReceiver))

  // }, [])

  // useEffect(() => {
  //   localStorage.setItem("items", JSON.stringify(items))
  // }, [items])


  // useEffect(() => {
  //   localStorage.setItem("invoiceInfo", JSON.stringify(invoiceInfo))
  // }, [invoiceInfo])


  // useEffect(() => {
  //   localStorage.setItem("receiverInfo", JSON.stringify(receiverInfo))
  // }, [receiverInfo])

  return (
    <div className="billing-container">
      {/* Left Column: Inputs */}
      <div className="input-section no-print">
        <h1>Billing System</h1>

        <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1rem' }}>
          <h3>Invoice Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Invoice Number</label>
              <input
                type="text"
                value={invoiceInfo.invoiceNo}
                onChange={e => setInvoiceInfo({ ...invoiceInfo, invoiceNo: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Invoice Date</label>
              <input
                type="date"
                value={invoiceInfo.date}
                onChange={e => setInvoiceInfo({ ...invoiceInfo, date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
          <h3>{editingId ? 'Update Product' : 'Add Product'}</h3>
          <form onSubmit={handleSubmitItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Product Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Paneer"
              />
            </div>
            <div className="input-group">
              <label>GST %</label>
              <select
                value={newItem.gst}
                onChange={e => setNewItem({ ...newItem, gst: Number(e.target.value) })}
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div className="input-group">
              <label>Quantity</label>
              <input
                type="number"
                value={newItem.qty}
                onChange={e => setNewItem({ ...newItem, qty: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="input-group">
              <label>Rate</label>
              <input
                type="number"
                value={newItem.rate}
                onChange={e => setNewItem({ ...newItem, rate: e.target.value })}
                placeholder="0"
              />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-add" style={{ flex: 1, marginTop: '0.5rem' }}>
                {editingId ? 'Update Item' : 'Add to Bill'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setNewItem({ name: '', qty: '', rate: '', gst: 5 })
                  }}
                  className="btn-add"
                  style={{ flex: 1, marginTop: '0.5rem', background: '#64748b' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginTop: '1rem' }}>
          <h3>Bill Items</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {items.map(item => (
              <div key={item.id} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>{item.name} (x{item.qty})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ marginRight: '8px' }}>₹{item.qty * item.rate}</span>
                  <button
                    onClick={() => startEdit(item)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleDownload} className="btn-add" style={{ background: '#10b981', marginTop: '2rem' }}>
          Download PDF
        </button>
      </div>

      {/* Right Column: Invoice Preview */}
      <div className="invoice-preview" id="invoice-bill">
        <div className="company-header">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ color: '#d946ef' }}>Sree Radhe Paneer Bhandar</h2>
          </div>
          <p style={{ margin: '2px 0' }}>PROPERTY N0.-11, SHOP NO.-1 , ADCHINI, NEW DELHI - 110017</p>
          <p style={{ margin: '2px 0' }}>Panner, Masala Paneer, Khoya, Amul Butter, Desi Ghee, Amul Cream, Crud, Matar & Milk etc.</p>
          <p style={{ margin: '2px 0' }}>GSTIN: 07EAPPS0129P1ZZ | Mob: 9818280190</p>
        </div>

        <div className="invoice-title">Invoice</div>

        <div className="details-grid">
          <div className="details-column">
            <div className="flex-between"><span>Reverse Charge (Y/N)</span> </div>
            <div className="flex-between"><span>Invoice no. :</span> <span className="font-bold">{invoiceInfo.invoiceNo}</span></div>
            <div className="flex-between"><span>Invoice Date :</span> <span>{formatDate(invoiceInfo.date)}</span></div>
            <div className="flex-between"><span>State :</span> <span> </span></div>
            <div className="flex-between" style={{ borderTop: '1px solid #e2e8f0', marginTop: '4px', paddingTop: '4px' }}>
              <span>State Code:</span> <span> </span>
            </div>
          </div>
          <div className="details-column">
            <div className="flex-between"><span>Transport Mode :</span> </div>
            <div className="flex-between"><span>Vehicle Number :</span></div>
            <div className="flex-between"><span>Date of Supply :</span> </div>
            <div className="flex-between"><span>Place of Supply :</span> <span></span></div>
          </div>
        </div>

        <div className="details-grid" style={{ borderTop: 'none' }}>
          <div className="details-column" style={{ borderRight: 'none' }}>
            <div className="font-bold" style={{ textAlign: 'center', marginBottom: '4px' }}>Detail of Receiver/Billed to:</div>
            <div className="flex-between"><span>Name:</span> <span className="font-bold">{receiverInfo.name}</span></div>
            <div className="flex-between"><span>Address: </span> <span>{receiverInfo.address}</span></div>
            <div className="flex-between"><span>GSTIN:</span> <span className="font-bold">{receiverInfo.gstin}</span></div>
            <div className="flex-between"><span>State:</span> <span>{receiverInfo.state}</span></div>
            <div className="flex-between" style={{ borderTop: '1px solid #e2e8f0', marginTop: '4px', paddingTop: '4px' }}>
              <span>State Code:</span> <span>{receiverInfo.stateCode}</span>
            </div>
          </div>
        </div>

        <table className="bill-table">
          <thead>
            <tr>
              <th rowSpan="2">S.No.</th>
              <th rowSpan="2" style={{ width: '25%' }}>Name of Product / Service</th>
              <th rowSpan="2">Qty</th>
              <th rowSpan="2">Rate</th>
              <th rowSpan="2">Amount</th>
              <th colSpan="2">CGST</th>
              <th colSpan="2">SGST</th>
            </tr>
            <tr>
              <th>Rate</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemTotals.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td className="text-left font-bold">{item.name}</td>
                <td>{item.qty}</td>
                <td>{item.rate}</td>
                <td>{item.amount.toFixed(2)}</td>
                <td>{item.cgstRate}%</td>
                <td>{item.cgstAmount.toFixed(2)}</td>
                <td>{item.sgstRate}%</td>
                <td>{item.sgstAmount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain height if needed */}
            {[...Array(Math.max(0, 8 - items.length))].map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: '24px' }}>
                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))}
            <tr>
              <td colSpan="4" className="font-bold">TOTAL</td>
              <td className="font-bold">{totalBeforeTax.toFixed(2)}</td>
              <td></td>
              <td className="font-bold">{totalCGST.toFixed(2)}</td>
              <td></td>
              <td className="font-bold">{totalSGST.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="totals-section">
          <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
            <p className="font-bold">Total Invoice amount in words:</p>
            <p style={{ textTransform: 'capitalize', fontStyle: 'italic' }}>
              {/* Simplified number to words would go here, using a static one for now or a helper */}
              Contact Administrator for amount in words.
            </p>

            <div style={{ marginTop: '20px', border: '1px solid #e2e8f0', padding: '10px' }}>
              <div className="font-bold" style={{ textDecoration: 'underline' }}>Bank Details</div>
              <p>Bank A/C : </p>
              <p>IFSC : </p>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.65rem' }}>
              <span className="font-bold">Terms & Conditions:</span>
              <ol style={{ margin: '4px 0', paddingLeft: '15px' }}>
                <li>Goods once sold will not be taken back.</li>
                <li>Subject to Delhi Jurisdiction.</li>
              </ol>
            </div>
          </div>
          <div>
            <div className="flex-between" style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>
              <span className="font-bold">Total Amount Before Tax</span>
              <span>{totalBeforeTax.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>
              <span>Add : CGST</span>
              <span>{totalCGST.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>
              <span>Add : SGST</span>
              <span>{totalSGST.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>
              <span>Add : IGST</span>
              <span> </span>
            </div>
            <div className="flex-between" style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span className="font-bold">Tax Amount GST</span>
              <span className="font-bold">{(totalCGST + totalSGST).toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ padding: '6px 8px', background: '#f1f5f9' }}>
              <span className="font-bold" style={{ fontSize: '0.9rem' }}>Total Amount After Tax</span>
              <span className="font-bold" style={{ fontSize: '0.9rem' }}>₹{totalAmountAfterTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center', padding: '10px' }}>
              <p style={{ margin: '0', fontSize: '0.6rem' }}>Certified that the particulars given above are true and correct</p>
              <p className="font-bold" style={{ margin: '10px 0' }}>For SREE RADHE PANEER BHANDAR</p>
              <div style={{ height: '40px' }}></div>
              <p className="font-bold">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
