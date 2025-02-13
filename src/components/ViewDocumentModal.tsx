'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel 
} from '@mui/material'

interface ViewDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  documentType: string
  documentStatus?: string
  onStatusChange?: (newStatus: string) => void
  isUpdating?: boolean
}

export default function ViewDocumentModal({ 
  isOpen, 
  onClose, 
  documentUrl, 
  documentType,
  documentStatus = 'pending',
  onStatusChange,
  isUpdating = false
}: ViewDocumentModalProps) {
  // PDF görüntüleyici URL'si oluştur
  const getPdfViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Kapat</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    Belge Görüntüleme
                  </Dialog.Title>
                  
                  {/* Durum Seçici */}
                  {onStatusChange && (
                    <div className="mb-4">
                      <FormControl fullWidth size="small">
                        <InputLabel>Durum</InputLabel>
                        <Select
                          value={documentStatus}
                          label="Durum"
                          onChange={(e) => onStatusChange(e.target.value)}
                          disabled={isUpdating}
                        >
                          <MenuItem value="pending">Bekliyor</MenuItem>
                          <MenuItem value="processed">İşlendi</MenuItem>
                          <MenuItem value="rejected">Reddedildi</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    {documentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={documentUrl}
                        alt="Belge"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="relative" style={{ height: '600px' }}>
                        <iframe
                          src={getPdfViewerUrl(documentUrl)}
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          style={{ border: 'none' }}
                          sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 