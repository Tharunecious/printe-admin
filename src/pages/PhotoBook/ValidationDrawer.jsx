import React from "react";
import { Drawer, Alert, Button, Tag } from "antd";
import {
  MdCheckCircle,
  MdError,
  MdWarning,
  MdArrowForward,
} from "react-icons/md";

const ValidationDrawer = ({
  open,
  onClose,
  validationResult,
  onSelectPageById,
}) => {
  if (!validationResult) return null;

  const { isValid, errors = [], warnings = [] } = validationResult;

  return (
    <Drawer
      title="Template Pre-Publish Validation"
      placement="right"
      width={450}
      open={open}
      onClose={onClose}
    >
      <div className="space-y-4">
        {isValid ? (
          <Alert
            message="Template is Valid & Ready to Publish"
            description="All page rules, photo frames, and metadata conform to photobook standards."
            type="success"
            showIcon
            icon={<MdCheckCircle className="text-emerald-500" size={24} />}
          />
        ) : (
          <Alert
            message="Validation Issues Found"
            description="The issues below must be resolved before this template can be published to customer projects."
            type="error"
            showIcon
            icon={<MdError className="text-rose-500" size={24} />}
          />
        )}

        {/* Errors list */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
              <MdError size={16} />
              <span>Required Fixes ({errors.length})</span>
            </h4>
            <div className="space-y-2">
              {errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <Tag color="red">{err.field}</Tag>
                  </div>
                  <p className="text-rose-900 font-medium">{err.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings list */}
        {warnings.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
              <MdWarning size={16} />
              <span>Recommendations & Warnings ({warnings.length})</span>
            </h4>
            <div className="space-y-2">
              {warnings.map((warn, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1"
                >
                  <Tag color="orange">{warn.field}</Tag>
                  <p className="text-amber-900 font-medium">{warn.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isValid && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Publishing will create an immutable version snapshot:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Existing customer projects retain their original version.</li>
              <li>New customer orders will automatically use this latest version.</li>
              <li>Templates become available to all associated products.</li>
            </ul>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default ValidationDrawer;
