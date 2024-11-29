"use client"

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import FileSaver from 'file-saver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ExcelToTxtConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<string[][]>([])
  const [columnWidths, setColumnWidths] = useState<number[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        setData(jsonData)
        updateColumnWidths(jsonData)
      }
      reader.readAsArrayBuffer(file)
    }
  }, [file])

  const updateColumnWidths = (jsonData: string[][]) => {
    const widths = jsonData.reduce((acc, row) => {
      row.forEach((cell, index) => {
        acc[index] = Math.max(acc[index] || 0, (cell?.toString() || '').length)
      })
      return acc
    }, [] as number[])
    setColumnWidths(widths)
  }

  const handleCellEdit = (rowIndex: number, cellIndex: number, value: string) => {
    const newData = [...data]
    newData[rowIndex][cellIndex] = value
    setData(newData)
    updateColumnWidths(newData)
  }

  const convertToTxt = () => {
    const alignedRows = data.map(row => 
      columnWidths.map((width, index) => 
        (row[index]?.toString() || '').padEnd(width + 2)
      ).join('')
    )
    return alignedRows.join('\n')
  }

  const exportToTxt = () => {
    const txtContent = convertToTxt()
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
    FileSaver.saveAs(blob, 'export/abastecimentos.txt')
  }

  return (
    <div className="container mx-auto p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Conversor de Excel para TXT</h1>
      <div className="mb-4 flex space-x-4">
        <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
        <Button onClick={exportToTxt} disabled={!file}>
          Exportar para TXT
        </Button>
      </div>

      {data.length > 0 && (
        <ScrollArea className="h-[600px] border rounded-md p-4">
          <Table>
            <TableHeader>
              <TableRow>
                {data[0].map((header, index) => (
                  <TableHead key={index} style={{ minWidth: `${columnWidths[index] * 8}px` }}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(1).map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Input
                        value={cell || ''}
                        onChange={(e) => handleCellEdit(rowIndex + 1, cellIndex, e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {data.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Pré-visualização do TXT</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
            {convertToTxt()}
          </pre>
        </div>
      )}
    </div>
  )
}

