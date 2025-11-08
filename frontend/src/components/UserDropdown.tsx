import { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import type { User } from '../types/auth';

interface UserDropdownProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function UserDropdown({
  users,
  selectedUserId,
  onSelect,
  error,
  disabled = false,
}: UserDropdownProps) {
  const [query, setQuery] = useState('');

  const selectedUser = users.find((user) => user.id === selectedUserId);

  // Filter users by Arabic name or branch name
  const filteredUsers =
    query === ''
      ? users
      : users.filter((user) => {
          const searchText = query.toLowerCase();
          return (
            user.fullName.toLowerCase().includes(searchText) ||
            user.branchName.toLowerCase().includes(searchText)
          );
        });

  return (
    <div className="w-full">
      <Combobox value={selectedUserId} onChange={onSelect} disabled={disabled}>
        <div className="relative">
          <Combobox.Label className="block text-sm font-semibold text-brand-primary-900 mb-2 text-right">
            اختر المستخدم
          </Combobox.Label>

          <div className="relative">
            <Combobox.Input
              className={`w-full px-4 py-3 pr-10 border rounded-lg text-right transition-all duration-300 text-brand-offwhite-900 ${
                error
                  ? 'border-brand-primary-500 focus:ring-brand-primary-500 focus:border-brand-primary-500 bg-brand-primary-50'
                  : 'border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900'
              } ${disabled ? 'bg-brand-offwhite-200 cursor-not-allowed' : 'bg-brand-offwhite-100'}`}
              displayValue={() =>
                selectedUser ? `${selectedUser.fullName} (${selectedUser.branchName})` : ''
              }
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن المستخدم..."
              autoComplete="off"
            />

            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-brand-offwhite-600" aria-hidden="true" />
            </Combobox.Button>
          </div>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-xl ring-1 ring-brand-offwhite-300 focus:outline-none border border-brand-offwhite-300">
              {filteredUsers.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-3 text-brand-offwhite-700 text-right">
                  لا توجد نتائج
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Combobox.Option
                    key={user.id}
                    value={user.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-3 px-4 pr-10 text-right transition-colors duration-300 ${
                        active
                          ? 'bg-brand-secondary-100 text-brand-primary-900'
                          : 'text-brand-offwhite-900'
                      }`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}
                        >
                          {user.fullName} ({user.branchName})
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                              active ? 'text-brand-primary-900' : 'text-brand-primary-900'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {error && (
        <p className="text-sm text-brand-primary-700 mt-1 text-right font-medium">{error}</p>
      )}
    </div>
  );
}
